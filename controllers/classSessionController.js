const db = require("./../models");
const factory = require("./factory");
const jwt = require("jsonwebtoken");
const Email = require("../utils/email");
const asyncWrapper = require("../asyncWrapper");
const path = require("path");
const testCallbackUrl =
  "http://localhost:8079/api/v1/class-sessions/ticket/verify";
const callbackUrl = "https://whatever.lat/api/v1/class-sessions/ticket/verify";
const paystackApi = require("../paystackApi");
const crypto = require("crypto");
const axios = require("axios");
const subAccount = require("../models/subAccount");
const TicketHolder = db.ticketHolders;
const jwtSecret = process.env.JWT_SECRET;
const ClassSession = db.classSessions;
const ClassTicket = db.classTickets;
const CancelTicket = db.cancelTickets;
const Location = db.locations;
const Comment = db.comments;
const Customer = db.customers;
const Host = db.hosts;
const Rating = db.ratings;
const SubAccount = db.subAccounts;
const PaymentTransaction = db.paymentTransactions;
const Room = db.rooms;
const mattermostUrl = process.env.MATTERMOST_URL;
const adminUsername = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;
const team_id = process.env.TEAM_ID;
const chatRoomLink = process.env.CHANNELROOMLINK;

// exports.createClassSession = factory.createDoc(ClassSession);
exports.getWithin = factory.getWithin(ClassSession);
exports.updateClassSession = factory.updateDoc(ClassSession);
exports.getUpcoming = factory.getUpcoming(ClassSession);
exports.getHistory = factory.getHistory(ClassSession);
exports.getEnriching = factory.getAllCategory("enriching");
exports.getLearning = factory.getAllCategory("learning");
exports.getSipping = factory.getAllCategory("sipping");
exports.getKids = factory.getAllCategory("kids");

exports.deleteClassSession = async (req, res) => {
  try {
    const doc = await ClassSession.findOne({ where: { id: req.params.id } });

    if (!doc) {
      return res.status(404).json({ error: "Doc not found" });
    }
    const associatedTickets = await ClassTicket.findAll({
      where: { classSessionId: doc.id },
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
          guestId: ticket.guestId,
          phoneNumber: customer.phone,
          refundPolicy: "flexible",
        });
      }
    }

    await doc.destroy();
    return res.status(200).json({ message: "Data deleted successful" });
  } catch (error) {
    console.log(error);
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
// exports.cancelTicket = factory.cancelTicket(ClassSession);

exports.createClassSession = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "please login" });
    }

    const decodedToken = jwt.verify(token, jwtSecret);
    const hostId = decodedToken.id;
    const subAccount =  await SubAccount.findOne({where: {hostId}});
    if (!subAccount) {
      return res.status(401).json({ error: "please create a subAccount" });
    }
    // Create a new class session
    const doc = await ClassSession.create({
      title: req.body.title,
      description: req.body.description,
      posterUrl: req.body.posterUrl,
      capacity: req.body.capacity,
      fullCapacity: req.body.fullCapacity,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      date: req.body.date,
      price: req.body.price,
      capacityStatus: req.body.capacityStatus,
      ageGroup: req.body.ageGroup,
      ageMin: req.body.ageMin,
      ageMax: req.body.ageMax,
      templateStatus: req.body.templateStatus,
      hostId: hostId,
      classCategory: req.body.classCategory,
    });

    const classId = doc.id;

    const bookExperienceUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/class-sessions/book/${classId}`;

    return res.status(201).json({msg: "Class session created successfully", doc, bookingUrl: bookExperienceUrl});
    // try {
    //   const uniqueChannelName = crypto
    //     .randomBytes(2)
    //     .toString("hex")
    //     .toLowerCase();
    //   const token = await getAuthToken();
    //   const name = `${uniqueChannelName}-${doc.title}`;
    //   const createMattermostGroup = await axios.post(
    //     `${mattermostUrl}/channels`,
    //     {
    //       name,
    //       display_name: doc.title,
    //       team_id,
    //       display_name: `${uniqueChannelName}-${doc.title}`,
    //       header: doc.title,
    //       type: "O",
    //     },

    //     {
    //       headers: {
    //         Authorization: `Bearer ${token}`,
    //       },
    //     }
    //   );
    //   const channelLink = `${chatRoomLink}/${name}`;
    //   await doc.update({ channelLink });

    //   return res.status(200).json({
    //     status: "Document/channel created successfully",
    //     bookingUrl: bookExperienceUrl,
    //     chatRoomLink: channelLink,
    //     doc,
    //   });
    // } catch (error) {
    //   console.log(error);
    //   return res.status(500).json({ error: "Internal server error" });
    // }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAllClassSession = async (req, res) => {
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
      const classSessionIds = locations.map(
        (location) => location.classSessionId
      );

      whereClause = { id: classSessionIds };
    }

    const docs = await ClassSession.findAll({
      limit: limit,
      offset: offset,
      order: [[order, "DESC"]],
      where: whereClause,
    });
    res
      .status(200)
      .json({ result: "Success", TotalDocs: docs.length, Document: docs });
  } catch (error) {
    console.log(error);
    res.status(500).json({ Error: error });
  }
};

exports.getOneClassSession = async (req, res, next) => {
  try {
    const classSessionId = req.params.id;
    const doc = await ClassSession.findByPk(classSessionId, {
      include: [
        {
          model: Location,
          as: "location",
          attributes: ["location", "latitude", "longitude"],
        },
        {
          model: ClassTicket,
          as: "ClassTicket",
          // where: { ticketStatus: "COMPLETE" },
          attributes: ["ticketId", "ticketStatus"],
        },

        {
          model: Host,
          as: "host",
          attributes: ["bio", "hostTitle", "qualifications"],
        },
        {
          model: Comment,
          as: "comment",
          attributes: ["comment"],
        },
      ],
    });

    const totalTickets = await ClassTicket.findAll({
      where: { ticketStatus: "ACTIVE" },
    });
    const canceledTickets = await ClassTicket.findAll({
      where: { ticketStatus: "CANCELED" },
    });

    const customerPurchase = totalTickets.length;
    const totalCanceledTickets = canceledTickets.length;

    if (!doc) {
      return next(res.status(404).json({ msg: "Not found" }));
    }
    const totalPackageAmount = parseInt(totalTickets.length) * doc.price;
    const totalRefundableAmount = canceledTickets.length * doc.price;

    return res.status(200).json({
      result: "Success",
      TotalCustomers: customerPurchase,
      TotalActiveTickets: totalTickets.length,
      TotalCanceledTickets: canceledTickets.length,
      totalPackageAmount: totalPackageAmount,
      totalPackageAmount: totalRefundableAmount,
      Data: doc,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ Error: error });
  }
};

exports.classSessionComments = async (req, res) => {
  try {
    const classSessionId = req.params.classSessionId;

    const classSession = await ClassSession.findOne({
      where: { id: classSessionId },
    });
    if (!classSession) {
      throw new Error("there is no ClassSession with that id");
    }

    const comments = await Comment.create({
      comment: req.body.comment,
      classSessionId: req.body.classSessionId,
    });

    res.status(201).json({ msg: "Comment created", comments });
  } catch (error) {
    res.status(500).json({ msg: "Internal server error" });
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
  const classId = req.params.classId;
  const classSession = await ClassSession.findOne({ where: { id: classId } });
  if (!classSession) {
    return res.status(404).json({
      error: "Please check the url again there is no classSession with that id",
    });
  }
  const hostId = classSession.hostId;

  const amount = classSession.price * 100;

  const paymentDetails = {
    amount,
    email,
    callback_url: callbackUrl,
    metadata: {
      amount,
      email,
      name,
    },
  };

  const data = await paystackApi.initializePayment(paymentDetails);
  const docHolder = await TicketHolder.create({
    classSessionId: classId,
    customerId,
    reference: data.reference,
    hostId,
  });

  return res.status(200).json({
    message: "Payment initialized successfully",
    data,
    classSession,
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

  const [payment, created] = await ClassTicket.findOrCreate({
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

  const updatedTicket = await ClassTicket.update(
    {
      hostId: findTicket.hostId,
      customerId: findTicket.customerId,
      classSessionId: findTicket.classSessionId,
    },
    {
      where: { paymentReference: findTicket.reference },
    }
  );

  const customer = await Customer.findOne({
    where: { id: findTicket.customerId },
  });
  await findTicket.destroy();
  const ticket = await ClassTicket.findOne({
    where: { paymentReference: findTicket.reference },
  });
  const otp = ticket.ticketId;
  // new Email(customer, url).classTicket();
  new Email(getGuest, null, null, null, null, null, otp).guestWelcome();

  return res.status(200).json({
    message: "Payment verified",
    data: payment,
  });
});

exports.verifyChatRoom = async (req, res) => {
  const classId = req.params.classId;
  try {
    const room = await Room.findOne({ where: { classId } });
    if (room) {
      res.sendFile(path.resolve("public", "chat.html"));
    } else {
      res.status(404).send("Chat room not found");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error checking chat room");
  }
};

exports.rateClass = async (req, res) => {
  const classId = req.params.classId;
  const rating = req.body.rating;

  try {
    const classFound = await ClassSession.findOne({ where: { id: classId } });
    if (!classFound) {
      return res.status(404).json({ error: "Class not found" });
    }

    const rate = await Rating.create({
      rating,
      classSessionId: classId,
    });

    const totalRatings = await Rating.findAll({
      where: { classSessionId: classId },
    });
    const averageRating =
      totalRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings.length;

    await ClassSession.update(
      { totalRating: averageRating },
      { where: { id: classId } }
    );

    return res.status(201).json({ success: "Thank you for rating", rate });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};
