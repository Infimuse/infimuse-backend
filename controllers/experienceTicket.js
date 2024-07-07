const factory = require("./factory");
const db = require("./../models");
const Email = require("../utils/email");
const jwt = require("jsonwebtoken");
const qrcode = require("qrcode");
const asyncWrapper = require("../asyncWrapper");
const paystackApi = require("../paystackApi");
const TicketHolder = db.ticketHolders;
const ExperienceTicket = db.experienceTickets;
const Customer = db.customers;
const Experience = db.experiences;
const PaymentTransaction = db.paymentTransactions;
const CancelTicket = db.cancelTickets;
const Host = db.hosts;
const Guest = db.guests;
const Community = db.communities;
const CommunityMembership = db.communityMemberships;
let experienceId;

// exports.createExperienceTicket = factory.createDoc(ExperienceTicket);
exports.getExperienceTicket = factory.getOneDoc(ExperienceTicket);
exports.getAllExperienceTickets = factory.getAllDocs(ExperienceTicket);
exports.updateExperienceTicket = factory.updateDoc(ExperienceTicket);
exports.deleteExperienceTicket = factory.deleteDoc(ExperienceTicket);

exports.ticketScan = async (req, res) => {
  const qrcode = req.body.qrcode;
  if (!qrcode) {
    return res.status(404).json({ error: "There is no qrcode to be scanned" });
  }

  const ticketId = await ExperienceTicket.findOne({
    where: { ticketId: qrcode },
  });
  if (!ticketId) {
    return res.status(404).json({ error: "No ticket with that ticketId" });
  }
  if (ticketId.ticketStatus != "ACTIVE") {
    return res.status(403).json({ error: "ticket status is not active" });
  }
  const model = await Experience.findOne({
    where: { id: ticketId.experienceId },
  });
  if (!model) {
    return res.status(404).json({ error: "model not found" });
  }
  await model.update({
    attendance: model.attendance + 1,
  });
  if (ticketId.customerId) {
    const customerId = ticketId.customerId;
    const customer = await Customer.findOne({ where: { id: customerId } });

    return res.status(200).json({
      customer: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        ticketStatus: ticketId.status,
        amount: ticketId.amount,
        experienceTitle: model.title,
        experienceDescription: model.description,
        experienceStart: model.startDate,
        experienceDate: model.endDate,
        experienceStatus: model.status,
      },
    });
  }
  const guest = await Guest.findOne({ where: { id: ticketId.guestId } });
  if (!guest) {
    return res
      .status(404)
      .json({ error: "ticket found but not as a guest or a customer" });
  }
  await model.update({
    attendance: model.attendance + 1,
  });
  return res.status(200).json({
    guest: {
      firstName: guest.firstName,
      email: guest.email,
      ticketStatus: ticketId.status,
      amount: ticketId.amount,
      experienceTitle: model.title,
      experienceDescription: model.description,
      experienceStart: model.startDate,
      experienceDate: model.endDate,
      experienceStatus: model.status,
    },
  });
};

exports.initializeBookingPayment = asyncWrapper(async (req, res) => {
  const { email, callbackUrl, name } = req.body;
  const experienceId = req.body.experienceId;
  const experience = await Experience.findOne({
    where: { id: experienceId },
  });
  if (!experience) {
    return res.status(404).json({
      error: "There is no experience with that id",
    });
  }
  const hostId = experience.hostId;
  const amount = experience.price;

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
    experienceId,
    customerId: req.body.customerId,
    reference: data.reference,
    hostId: req.body.hostId,
  });

  return res.status(200).json({
    message: "Payment initialized successfully",
    data,
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
    return res.status(404).json({ error: "ticket not found in ticketHolder" });
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
  if (!updatedTicket) {
    throw new Error("Failed to update the ticket");
  }

  const customer = await Customer.findOne({
    where: { id: findTicket.customerId },
  });

  const ticket = await ExperienceTicket.findOne({
    where: { paymentReference: findTicket.reference },
  });

  const url = ticket.ticketId;
  const experienceId = ticket.experienceId;
  const experience = await Experience.findOne({ where: { id: experienceId } });

  if (!experience) {
    throw new Error("Experience not found");
  }

  const channelLink = experience.channelLink;
  const qrCodeURL = ticket.ticketId;

  new Email(
    customer,
    url,
    null,
    null,
    null,
    null,
    qrCodeURL,
    null,
    channelLink
  ).experienceTicket();

  const hostId = experience.hostId;

  const communities = await Community.findOne({
    where: { hostId },
  });

  if (!communities) {
    return res
      .status(404)
      .json({ error: "The host has not created a community yet" });
  }
  const existingMembership = await CommunityMembership.findOne({
    where: {
      communityId: communities.id,
      customerId: findTicket.customerId,
    },
  });

  if (!existingMembership) {
    await CommunityMembership.create({
      communityId: communities.id,
      customerId: findTicket.customerId,
    });
  }
  await findTicket.destroy();

  return res.status(200).json({
    message: "Payment verified",
    data: payment,
  });
});

exports.cancelTicket = async (req, res, next) => {
  const ticketId = req.params.ticketId;
  try {
    const ticket = await ExperienceTicket.findOne({
      where: { ticketId: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }
    const userTicket = ticket.customerId;
    const customer = await Customer.findOne({
      where: { id: userTicket },
    });

    const paymentId = ticket.paymentTransactionId;
    const payment = await PaymentTransaction.findOne({
      where: { id: paymentId },
    });
    const listingAmount = payment.amount;
    const customerId = payment.customerId;
    const phone = payment.phoneNumber;
    const host = ticket.hostId;
    const experienceTicket = ticket.ticketId;
    const listingId = ticket.experienceId;
    if (ticket.ticketStatus === "CANCELED") {
      return res
        .status(403)
        .json({ error: "You cannot cancel a ticket twice" });
    }
    const session = await Experience.findOne({
      where: { id: listingId },
    });

    const date = session.startDate;

    const sessionTime = new Date(session.startDate).getTime();
    const cancellationTime = new Date().getTime();
    const timeDiffInMillSec = sessionTime - cancellationTime;
    const timeToClass = timeDiffInMillSec / (1000 * 3600);

    if (timeToClass <= 0) {
      return res.status(403).json({
        error: "You cannot cancel a ticket once the classes have started",
      });
    } else if (timeToClass <= 12) {
      return res.status(403).json({
        Error: "You can only cancel a ticket not later than 12 hours to class",
      });
    }

    const updateStatus = await ExperienceTicket.update(
      { ticketStatus: "CANCELED" },
      { where: { ticketId: ticketId } }
    );

    const canceledTicket = await CancelTicket.create({
      TicketId: experienceTicket,
      amount: listingAmount,
      hostId: host,
      customerId: customerId,
      experienceId: listingId,
      phoneNumber: phone,
    });

    const url = canceledTicket.TicketId;

    const amount = canceledTicket.amount;
    const title = session.title;
    const listingDescription = session.description;
    // console.log();
    await new Email(
      customer,
      url,
      title,
      listingDescription,
      date,
      amount
    ).canceledTicket();

    // await ticket.destroy();

    return res.status(201).json({ msg: "status changed", canceledTicket });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};
