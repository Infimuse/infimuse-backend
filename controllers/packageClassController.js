const factory = require("./factory");
const db = require("./../models");
const jwt = require("jsonwebtoken");
const asyncWrapper = require("../asyncWrapper");
const paystackApi = require("../paystackApi");
const Email = require("../utils/email");
const testCallbackUrl =
  "http://localhost:8080/api/v1/package-classes/ticket/verify";
const callbackUrl = "https://whatever.lat/api/v1/package-classes/ticket/verify";
const crypto = require("crypto");
const axios = require("axios");
const TicketHolder = db.ticketHolders;
const PackageClass = db.packageClasses;
const PackageTicket = db.packageTickets;
const Comment = db.comments;
const Location = db.locations;
const Host = db.hosts;
const Rating = db.ratings;
const PaymentTransaction = db.paymentTransactions;
const CancelTicket = db.cancelTickets;
const Customer = db.customers;
const jwtSecret = process.env.JWT_SECRET;
const mattermostUrl = process.env.MATTERMOST_URL;
const adminUsername = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;
const team_id = process.env.TEAM_ID;
const chatRoomLink = process.env.CHANNELROOMLINK;

exports.getAllPackageClass = factory.getAllDocs(PackageClass);
exports.updatePackageClass = factory.updateDoc(PackageClass);
exports.getWithin = factory.getWithin(PackageClass);
exports.getUpcoming = factory.getUpcoming(PackageClass);
exports.getHistory = factory.getHistory(PackageClass);

// exports.deletePackageClass = factory.deleteDoc(PackageClass);

exports.deletePackageClass = async (req, res) => {
  try {
    const doc = await PackageClass.findOne({ where: { id: req.params.id } });

    if (!doc) {
      return res.status(404).json({ error: "Doc not found" });
    }
    const associatedTickets = await PackageTicket.findAll({
      where: { packageClassId: doc.id },
    });

    if (associatedTickets.length > 0) {
      for (const ticket of associatedTickets) {
        await ticket.update({ ticketStatus: "CANCELED" });
        const customerId = ticket.customerId;
        const customer = await Customer.findOne({ where: { id: customerId } });

        await CancelTicket.create({
          TicketId: ticket.ticketId,
          amount: ticket.amount,
          hostId: ticket.hostId,
          customerId: ticket.customerId,
          phoneNumber: customer.phone,
          refundPolicy: "flexible",
        });
      }
    }
    await doc.destroy();
    return res.status(200).json({ message: "Data deleted successful" });
  } catch (error) {
    return res.status(500).json({ Error: error });
  }
};

const getAuthToken = async () => {
  try {
    const response = await axios.post(`${mattermostUrl}/users/login`, {
      login_id: adminUsername,
      password: adminPassword,
    });
    return response.headers.token;
  } catch (error) {
    throw new Error("Failed to authenticate with Mattermost: " + error.message);
  }
};

exports.createPackageClass = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "please login" });
  }

  const decodedToken = jwt.verify(token, jwtSecret);
  const hostId = decodedToken.id;
  try {
    const doc = await PackageClass.create({
      title: req.body.title,
      description: req.body.description,
      posterUrl: req.body.posterUrl,
      duration: req.body.duration,
      startDate: req.body.startDate,
      capacity: req.body.capacity,
      endDate: req.body.endDate,
      date: req.body.date,
      price: req.body.price,
      capacityStatus: req.body.capacityStatus,
      ageGroup: req.body.ageGroup,
      ageMin: req.body.ageMin,
      ageMax: req.body.ageMax,
      templateStatus: req.body.templateStatus,
      hostId,
    });

    const packageClassId = doc.id;
    const bookPackageUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/package-classes/book/${packageClassId}`;

    try {
      const uniqueChannelName = crypto
        .randomBytes(2)
        .toString("hex")
        .toLowerCase();
      const token = await getAuthToken();
      const name = `${uniqueChannelName}-${doc.title}`;
      const createMattermostGroup = await axios.post(
        `${mattermostUrl}/channels`,
        {
          name,
          display_name: `${uniqueChannelName}-${doc.title}`,
          team_id,
          header: doc.title,
          type: "O",
        },

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const channelLink = `${chatRoomLink}/${name}`;
      await doc.update({ channelLink });
      return res.status(200).json({
        status: "Document/channel created successfully",
        bookingUrl: bookPackageUrl,
        chatRoomLink: channelLink,
        doc,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getPackageClass = async (req, res, next) => {
  try {
    const packageClassId = req.params.id;
    const doc = await PackageClass.findByPk(packageClassId, {
      include: [
        {
          model: PackageTicket,
          as: "packageTicket",
          // where: { ticketStatus: "COMPLETE" },
          attributes: ["ticketId", "ticketStatus"],
        },
        {
          model: Comment,
          as: "comment",
          attributes: ["comment"],
        },
        {
          model: Host,
          as: "host",
          attributes: ["bio", "hostTitle", "qualifications"],
        },
      ],
    });

    const totalTickets = await PackageTicket.findAll({
      where: { packageClassId: doc.id, ticketStatus: "ACTIVE" },
    });
    const canceledTicket = await PackageTicket.findAll({
      where: { ticketStatus: "CANCELED" },
    });
    const customerPurchase = totalTickets.length;

    if (!doc) {
      return res
        .status(404)
        .render("error404", { error: "Document not found" });
    }
    const totalPackageAmount = parseInt(totalTickets.length) * doc.price;
    const totalRefundableAmount = canceledTicket.length * doc.price;

    return res.status(200).json({
      result: "Success",
      TotalCustomers: customerPurchase,
      TotalActiveTickets: totalTickets.length,
      TotalCanceledTickets: canceledTicket.length,
      totalPackageAmount: totalPackageAmount,
      totalPackageAmount: totalRefundableAmount,
      Data: doc,
    });
  } catch (error) {
    res.status(500).json({ Error: error });
  }
};

exports.getAllPackageClass = async (req, res) => {
  try {
    // paginate
    const page = parseInt(req.query.page, 15) || 1;
    const limit = parseInt(req.query.limit, 15) || 15;
    const offset = (page - 1) * limit;
    // sorting
    const sortFields = ["location", "price"];
    const sortBy = req.query.sort;
    const order = sortFields.includes(sortBy) ? sortBy : "createdAt";

    // location Filter
    const { location } = req.query;
    let whereClause = {};
    if (location) {
      const locations = await Location.findAll({
        where: { location },
      });
      const packageIds = locations.map((location) => location.packageClassId);

      whereClause = { id: packageIds };
    }

    const docs = await PackageClass.findAll({
      limit: limit,
      offset: offset,
      order: [[order, "DESC"]],
      where: whereClause,
    });
    return res
      .status(200)
      .json({ result: "Success", TotalDocs: docs.length, Document: docs });
  } catch (error) {
    return res.status(500).json({ Error: error });
  }
};

exports.packageClassComments = async (req, res) => {
  try {
    const packageClassId = req.params.packageClassId;

    const packageClass = await PackageClass.findOne({
      where: { id: packageClassId },
    });
    if (!packageClass) {
      throw new Error("there is no PackageClass with that id");
    }

    const comments = await Comment.create({
      comment: req.body.comment,
      packageClassId: req.body.packageClassId,
    });

    // await PackageClass.addComment(comments);

    return res.status(201).json({ msg: "Comment created", comments });
  } catch (error) {
    return res.status(500).json({ msg: "Internal server error" });
  }
};

exports.initializeBookingPayment = asyncWrapper(async (req, res) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];
  if (!token) {
    return res.status(404).json({ error: "Please login" });
  }

  const decodedToken = jwt.verify(token, jwtSecret);
  const customerId = decodedToken.id;
  const customer = await Customer.findOne({ where: { id: customerId } });

  if (!customer) {
    return res.status(401).json({ error: "No customer with that Id" });
  }
  const email = customer.email;
  const name = customer.firstName;
  const callback_url = callbackUrl;
  const packageClassId = req.params.packageClassId;
  const package = await PackageClass.findOne({ where: { id: packageClassId } });
  if (!package) {
    return res.status(404).json({
      error: "Please check the url again there is no Package with that id",
    });
  }
  const hostId = package.hostId;

  const amount = package.price;

  const paymentDetails = {
    amount: amount * 100,
    email,
    callback_url: callbackUrl,
    metadata: {
      amount: amount * 100,
      email,
      name,
    },
  };

  const data = await paystackApi.initializePayment(paymentDetails);
  const docHolder = await TicketHolder.create({
    packageClassId,
    customerId,
    reference: data.reference,
    hostId,
  });

  return res.status(200).json({
    message: "Payment initialized successfully",
    data,
    package,
  });
});

exports.verifyPayment = asyncWrapper(async (req, res) => {
  const reference = req.query.reference;

  if (!reference) {
    throw new Error("Missing transaction reference");
  }

  const {
    data: {
      metadata: { email, amount, name },
      reference: paymentReference,
      status: transactionStatus,
    },
  } = await paystackApi.verifyPayment(reference);

  if (transactionStatus !== "success") {
    throw new Error(`Transaction: ${transactionStatus}`);
  }

  const [payment, created] = await PackageTicket.findOrCreate({
    where: { paymentReference },
    defaults: { amount, email, name, paymentReference },
  });

  if (!created) {
    return res.status(402).json({ error: "Couldn't create a ticket" });
  }

  const findTicket = await TicketHolder.findOne({
    where: { reference: payment.paymentReference },
  });

  if (!findTicket) {
    return res.status(404).json({ error: "ticket not found in ticketHolder" });
  }

  const updatedTicket = await PackageTicket.update(
    {
      hostId: findTicket.hostId,
      customerId: findTicket.customerId,
      packageClassId: findTicket.packageClassId,
    },
    {
      where: { paymentReference: findTicket.reference },
    }
  );

  const customer = await Customer.findOne({
    where: { id: findTicket.customerId },
  });
  await findTicket.destroy();
  const ticket = await PackageTicket.findOne({
    where: { paymentReference: findTicket.reference },
  });
  const url = ticket.ticketId;
  new Email(customer, url).packageTicket();

  return res.status(200).json({
    message: "Payment verified",
    data: payment,
  });
});

exports.rateClass = async (req, res) => {
  const packageClassId = req.params.packageClassId;
  const rating = req.body.rating;

  try {
    const classFound = await PackageClass.findOne({
      where: { id: packageClassId },
    });
    if (!classFound) {
      return res.status(404).json({ error: "PackageClass not found" });
    }

    const rate = await Rating.create({
      rating,
      packageClassId: packageClassId,
    });

    const totalRatings = await Rating.findAll({
      where: { packageClassId: packageClassId },
    });
    const averageRating =
      totalRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings.length;

    await ClassSession.update(
      { totalRating: averageRating },
      { where: { id: packageClassId } }
    );

    return res.status(201).json({ success: "Thank you for rating", rate });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
