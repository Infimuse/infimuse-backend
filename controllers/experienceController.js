const db = require("./../models");
const factory = require("./factory");
const jwt = require("jsonwebtoken");
const asyncWrapper = require("../asyncWrapper");
const paystackApi = require("../paystackApi");
const experienceTicket = require("./experienceTicket");
const testCallbackUrl =
  "http://localhost:8079/api/v1/experiences/ticket/verify";
const callbackUrl = "https://whatever.lat/api/v1/experiences/ticket/verify";
const crypto = require("crypto");
const axios = require("axios");
const Email = require("../utils/email");
const Venue = db.venues;
const Experience = db.experiences;
const ExperienceTicket = db.experienceTickets;
const CancelTicket = db.cancelTickets;
const Location = db.locations;
const Comment = db.comments;
const Host = db.hosts;
const TicketHolder = db.ticketHolders;
const Customer = db.customers;
const Rating = db.ratings;
const SubAccount = db.subAccounts;
const PaymentTransaction = db.paymentTransactions;
const jwtSecret = process.env.JWT_SECRET;
const mattermostUrl = process.env.MATTERMOST_URL;
const adminUsername = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;
const team_id = process.env.TEAM_ID;
const chatRoomLink = process.env.CHANNELROOMLINK;

// exports.createExperience = factory.createDoc(Experience);
exports.getWithin = factory.getWithin(Experience);
exports.updateExperience = factory.updateDoc(Experience);
exports.getUpcoming = factory.getUpcoming(Experience);
exports.getHistory = factory.getHistory(Experience);

exports.deleteExperience = async (req, res) => {
  try {
    const doc = await Experience.findOne({ where: { id: req.params.id } });

    if (!doc) {
      return res.status(404).json({ error: "Doc not found" });
    }
    const associatedTickets = await ExperienceTicket.findAll({
      where: { experienceId: doc.id },
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
// exports.cancelTicket = factory.cancelTicket(Experience);

exports.createExperience = async (req, res, next) => {
  try {
    const title = req.body.title;
    const description = req.body.description;
    const posterUrl = req.body.posterUrl;
    const capacity = req.body.capacity;
    const fullCapacity = req.body.fullCapacity;
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    const startTime = req.body.startTime;
    const endTime = req.body.endTime;
    const date = req.body.date;
    const price = req.body.price;
    const capacityStatus = req.body.capacityStatus;
    const ageGroup = req.body.ageGroup;
    const ageMin = req.body.ageMin;
    const ageMax = req.body.ageMax;
    const templateStatus = req.body.templateStatus;
    const venueId = req.body.venueId;
    const experienceCategory = req.body.experienceCategory;

    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Please login" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const hostId = decodedToken.id;

    const subAccount =  await SubAccount.findOne({where: {hostId}});
    if (!subAccount) {
      return res.status(401).json({ error: "please create a subAccount" });
    }
    if (!venueId) {
      return res.status(403).json({ error: "Please provide the venueId" });
    }

    const venueCheck = await Venue.findOne({ where: { id: venueId } });
    if (!venueCheck) {
      return res.status(404).json({ error: "No venue with that id found" });
    }
    if (venueCheck.hostId !== hostId) {
      return res
        .status(403)
        .json({ error: "The venue you selected does not belong to you" });
    }

    const doc = await Experience.create({
      title: title,
      description: description,
      posterUrl: posterUrl,
      capacity: capacity,
      fullCapacity: fullCapacity,
      startDate: startDate,
      endDate: endDate,
      startTime: startTime,
      endTime: endTime,
      date: date,
      price: price,
      capacityStatus: capacityStatus,
      ageGroup: ageGroup,
      ageMin: ageMin,
      ageMax: ageMax,
      templateStatus: templateStatus,
      hostId: hostId,
      venueId,
      experienceCategory,
    });
    const experienceId = doc.id;

    const bookExperienceUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/experiences/book/${experienceId}`;
    try {
      const uniqueChannelName = crypto
        .randomBytes(2)
        .toString("hex")
        .toLowerCase();
      console.log(uniqueChannelName);
      const token = await getAuthToken();
      const name = `${uniqueChannelName}-${doc.title}`;
      const createMattermostGroup = await axios.post(
        `${mattermostUrl}/channels`,
        {
          name,
          display_name: doc.title,
          team_id,
          display_name: `${uniqueChannelName}-${doc.title}`,
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
        bookingUrl: bookExperienceUrl,
        chatRoomLink: channelLink,
        doc,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAllExperience = async (req, res) => {
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
      const ExperienceIds = locations.map((location) => location.ExperienceId);

      whereClause = { id: ExperienceIds };
    }

    const docs = await Experience.findAll({
      limit: limit,
      offset: offset,
      order: [[order, "DESC"]],
      where: whereClause,
    });
    res
      .status(200)
      .json({ result: "Success", TotalDocs: docs.length, Document: docs });
  } catch (error) {
    res.status(500).json({ Error: error });
  }
};

exports.getOneExperience = async (req, res, next) => {
  try {
    const ExperienceId = req.params.id;
    const doc = await Experience.findByPk(ExperienceId, {
      include: [
        {
          model: Location,
          as: "location",
          attributes: ["location", "latitude", "longitude"],
        },
        {
          model: ExperienceTicket,
          as: "experienceTicket",
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

    const totalTickets = await ExperienceTicket.findAll({
      where: { ticketStatus: "COMPLETE" },
    });
    const canceledTickets = await ExperienceTicket.findAll({
      where: { ticketStatus: "CANCELED" },
    });

    const customerPurchase = totalTickets.length;
    const totalCanceledTickets = canceledTickets.length;

    if (!doc) {
      return next(res.status(404).json({ msg: "Not found" }));
    }
    res.status(200).json({
      result: "Success",
      totalCustomers: customerPurchase,
      totalCompleteTickets: customerPurchase,
      canceledTicket: totalCanceledTickets,
      Data: doc,
    });
  } catch (error) {
    res.status(500).json({ Error: error });
  }
};

exports.ExperienceComments = async (req, res) => {
  try {
    const ExperienceId = req.params.ExperienceId;

    const Experience = await Experience.findOne({
      where: { id: ExperienceId },
    });
    if (!Experience) {
      throw new Error("there is no Experience with that id");
    }

    const comments = await Comment.create({
      comment: req.body.comment,
      ExperienceId: req.body.ExperienceId,
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
  const experienceId = req.params.experienceId;
  const experience = await Experience.findOne({ where: { id: experienceId } });
  if (!experience) {
    return res.status(404).json({
      error: "Please check the url again there is no Experience with that id",
    });
  }
  const hostId = experience.hostId;

  const amount = experience.price;

  const paymentDetails = {
    amount,
    email: amount * 100,
    callback_url: callbackUrl,
    metadata: {
      amount: amount * 100,
      email,
      name,
    },
  };

  const data = await paystackApi.initializePayment(paymentDetails);
  const docHolder = await TicketHolder.create({
    experienceId,
    customerId,
    reference: data.reference,
    hostId,
  });

  return res.status(200).json({
    message: "Payment initialized successfully",
    data,
    experience,
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

  const [payment, created] = await ExperienceTicket.findOrCreate({
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
    return res.status(404).json({ error: "ticket not found" });
  }

  const updatedTicket = await ExperienceTicket.update(
    {
      hostId: findTicket.hostId,
      customerId: findTicket.customerId,
      experienceId: findTicket.experienceId,
    },
    {
      where: { paymentReference: findTicket.reference },
    }
  );

  const customer = await Customer.findOne({
    where: { id: findTicket.customerId },
  });
  await findTicket.destroy();
  const ticket = await ExperienceTicket.findOne({
    where: { paymentReference: findTicket.reference },
  });
  const url = ticket.ticketId;
  new Email(customer, url).experienceTicket();

  return res.status(200).json({
    message: "Payment verified",
    data: payment,
  });
});

exports.rateClass = async (req, res) => {
  const experienceId = req.params.experienceId;
  const rating = req.body.rating;

  try {
    const classFound = await Experience.findOne({
      where: { id: experienceId },
    });
    if (!classFound) {
      return res.status(404).json({ error: "Experience not found" });
    }

    const rate = await Rating.create({
      rating,
      experienceId: experienceId,
    });

    const totalRatings = await Rating.findAll({
      where: { experienceId: experienceId },
    });
    const averageRating =
      totalRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings.length;

    await ClassSession.update(
      { totalRating: averageRating },
      { where: { id: experienceId } }
    );

    return res.status(201).json({ success: "Thank you for rating", rate });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
