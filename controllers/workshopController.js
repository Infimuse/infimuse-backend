const factory = require("./factory");
const db = require("./../models");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { Op, Sequelize } = require("sequelize");
const asyncWrapper = require("../asyncWrapper");
const paystackApi = require("../paystackApi");
const express = require("express");
const Email = require("../utils/email");
// change when we go live
const testCallbackUrl = "http://localhost:8079/api/v1/workshops/ticket/verify";
const callbackUrl = "https://whatever.lat/api/v1/workshops/ticket/verify";
const crypto = require("crypto");
const jwtSecret = process.env.JWT_SECRET;
const Workshop = db.workshops;
const Comment = db.comments;
const workshopTicket = db.workshopTickets;
const Location = db.locations;
const Host = db.hosts;
const CancelTicket = db.cancelTickets;
const WorkshopTicket = db.workshopTickets;
const PaymentTransaction = db.paymentTransactions;
const TicketHolder = db.ticketHolders;
const SubAccount = db.subAccounts;
const app = express();
const Customer = db.customers;
const mattermostUrl = process.env.MATTERMOST_URL;
const adminUsername = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;
const team_id = process.env.TEAM_ID;
const WorkshopClass = db.workshopClasses;
const chatRoomLink = process.env.CHANNELROOMLINK;
// Enable trusting of proxy headers
https: http: app.set("trust proxy", true);

exports.getWithin = factory.getWithin(Workshop);
exports.updateWorkshop = factory.updateDoc(Workshop);
exports.getUpcoming = factory.getUpcoming(Workshop);
exports.getHistory = factory.getHistory(Workshop);

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

exports.createWorkshop = async (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];
  if (!token) {
    return res.status(404).json({ error: "Please login" });
  }

  const decodedToken = jwt.verify(token, jwtSecret);
  const hostId = decodedToken.id;
  const subAccount =  await SubAccount.findOne({where: {hostId}});
    if (!subAccount) {
      return res.status(401).json({ error: "please create a subAccount" });
    }
  try {
    const doc = await Workshop.create({
      title: req.body.title,
      description: req.body.description,
      posterUrl: req.body.posterUrl,
      duration: req.body.duration,
      startDate: req.body.startDate,
      capacity: req.body.capacity,
      fullCapacity: req.body.fullCapacity,
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
    const workshopId = doc.id;

    const bookWorkshopLink = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/workshops/book/${workshopId}`;

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
        bookingUrl: bookWorkshopLink,
        chatRoomLink: channelLink,
        doc,
      });
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  } catch (err) {
    return res.status(500).json({ status: "Internal server error" });
  }
};

exports.getWorkshop = async (req, res, next) => {
  try {
    const workshopId = req.params.id;
    const doc = await Workshop.findByPk(workshopId, {
      include: [
        {
          model: workshopTicket,
          as: "workshopTicket",
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
    if (!doc) {
      return res.status(404).json({ msg: "No doc with that id" });
    }
    const totalTickets = await workshopTicket.findAll({
      where: { workshopId: doc.id, ticketStatus: "ACTIVE" },
    });
    const canceledTicket = await workshopTicket.findAll({
      where: { ticketStatus: "CANCELED" },
    });
    const customerPurchase = totalTickets.length;

    if (!doc) {
      return res
        .status(404)
        .render("error404", { error: "Document not found" });
    }
    const workshopClass = await WorkshopClass.findAll({
      where: { workshopId },
    });

    const totalWorkshopClasses = workshopClass.length;
    const totalWorkshopAmount = parseInt(totalTickets.length) * doc.price;
    const totalRefundableAmount = canceledTicket.length * doc.price;
    const processingFee = (8 / 100) * totalWorkshopAmount;
    const AmountPayable = totalWorkshopAmount - processingFee;

    return res.status(200).json({
      result: "Success",
      TotalCustomers: customerPurchase,
      TotalActiveTickets: totalTickets.length,
      TotalCanceledTickets: canceledTicket.length,
      WorkshopTotalAmount: totalWorkshopAmount,
      WorkshopTotalRefundableAmount: totalRefundableAmount,
      totalWorkshopClasses: totalWorkshopClasses,
      ProcessingFee: processingFee,
      AmountPayable: AmountPayable,
      Data: doc,
    });
  } catch (error) {
    return res.status(500).json({ Error: error });
  }
};

exports.getAllWorkshop = async (req, res) => {
  try {
    // paginate
    const page = parseInt(req.query.page, 15) || 1;
    const limit = parseInt(req.query.limit, 15) || 15;
    const offset = (page - 1) * limit;
    // sorting
    const sortFields = ["price"];
    const sortBy = req.query.sort;
    const order = sortFields.includes(sortBy) ? sortBy : "createdAt";

    // location Filter
    const { location } = req.query;
    let whereClause = {};
    if (location) {
      const locations = await Location.findAll({
        where: { location },
      });
      const workshopIds = locations.map((location) => location.workshopId);

      whereClause = { id: workshopIds };
    }

    const docs = await Workshop.findAll({
      limit: limit,
      offset: offset,
      order: [[order, "DESC"]],
      where: whereClause,
    });

    // const TotalCustomers=
    return res
      .status(200)
      .json({ result: "Success", TotalDocs: docs.length, Document: docs });
  } catch (error) {
    return res.status(500).json({ Error: error });
  }
};

exports.workshopComments = async (req, res) => {
  try {
    const workshopId = req.params.workshopId;

    const workshop = await Workshop.findOne({ where: { id: workshopId } });
    if (!workshop) {
      throw new Error("there is no workshop with that id");
    }

    const comments = await Comment.create({
      comment: req.body.comment,
    });

    await workshop.addComment(comments);

    return res.status(201).json({ msg: "Comment created", comments });
  } catch (error) {
    return res.status(500).json({ msg: "Internal server error" });
  }
};

exports.deleteWorkshop = async (req, res, next) => {
  try {
    const doc = await Workshop.findOne({ where: { id: req.params.id } });

    if (!doc) {
      return res.status(404).json({ error: "Doc not found" });
    }
    const associatedTickets = await workshopTicket.findAll({
      where: { workshopId: doc.id },
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
          workshopId: ticket.workshopId,
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
  const workshopId = req.params.workshopId;

  const workshop = await Workshop.findOne({ where: { id: workshopId } });
  if (!workshop) {
    return res.status(404).json({
      error: "There is no workshop with that id",
    });
  }
  const hostId = workshop.hostId;
  const amount = workshop.price;

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
    workshopId,
    customerId,
    reference: data.reference,
    hostId,
  });

  return res.status(200).json({
    message: "Payment initialized successfully",
    data,
    workshop,
  });
});

exports.verifyPayment = asyncWrapper(async (req, res) => {
  const reference = req.query.reference;

  if (!reference) {
    return res.status(400).json({ error: "Missing transaction reference" });
  }

  try {
    const { data } = await paystackApi.verifyPayment(reference);

    const {
      metadata: { email, amount, name },
      reference: paymentReference,
      status: transactionStatus,
    } = data;

    if (transactionStatus !== "success") {
      return res
        .status(400)
        .json({ error: `Transaction: ${transactionStatus}` });
    }

    const [payment, created] = await WorkshopTicket.findOrCreate({
      where: { paymentReference },
      defaults: { amount, email, name, paymentReference },
    });

    if (!created) {
      return res.status(402).json({ error: "Couldn't create a ticket" });
    }

    const findTicket = await TicketHolder.findOne({
      where: { reference: payment.paymentReference },
    });

    if (findTicket) {
      const updatedTicket = await WorkshopTicket.update(
        {
          hostId: findTicket.hostId,
          customerId: findTicket.customerId,
          workshopId: findTicket.workshopId,
        },
        {
          where: { paymentReference: findTicket.reference },
        }
      );

      const customer = await Customer.findOne({
        where: { id: findTicket.customerId },
      });

      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      new Email(customer, updatedTicket.ticketId).workshopTicket();
      await findTicket.destroy();
    }

    return res.status(200).json({
      message: "Payment verified",
      data: payment,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "An error occurred while verifying payment" });
  }
});
exports.rateClass = async (req, res) => {
  const workshopId = req.params.workshopId;
  const rating = req.body.rating;

  try {
    const classFound = await Workshop.findOne({
      where: { id: workshopId },
    });
    if (!classFound) {
      return res.status(404).json({ error: "workshop not found" });
    }

    const rate = await Rating.create({
      rating,
      workshopId: workshopId,
    });

    const totalRatings = await Rating.findAll({
      where: { workshopId: workshopId },
    });
    const averageRating =
      totalRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings.length;

    await ClassSession.update(
      { totalRating: averageRating },
      { where: { id: workshopId } }
    );

    return res.status(201).json({ success: "Thank you for rating", rate });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};
