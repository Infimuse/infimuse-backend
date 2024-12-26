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
const HostPlan = db.hostPlans;
const Commission = db.commissions;
const Guest = db.guests;
const Community = db.communities;
const Waitlist = db.waitlists;
const DST = db.DST;
const InfimuseAccount = db.InfimuseAccount;
const CommunityMembership = db.communityMemberships;
const test_callbackUrl =
  "http://localhost:8080/api/v1/experience-tickets/verify";
const callbackUrl = "https://whatever.lat/api/v1/experience-tickets/verify";
let experienceId;

// exports.createExperienceTicket = factory.createDoc(ExperienceTicket);
exports.getExperienceTicket = factory.getOneDoc(ExperienceTicket);
exports.getAllExperienceTickets = factory.getAllDocs(ExperienceTicket);
exports.updateExperienceTicket = factory.updateDoc(ExperienceTicket);
exports.deleteExperienceTicket = factory.deleteDoc(ExperienceTicket);

exports.initializeBookingPayment = asyncWrapper(async (req, res) => {
  const experienceId = req.body.experienceId;

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorised" });
  }
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  const id = decodedToken.id;
  const customer = await Customer.findOne({ where: id });
  if (!customer) {
    return res.status(404).json({ error: "customer not found" });
  }

  const experience = await Experience.findOne({
    where: { id: experienceId },
  });
  if (!experience) {
    return res.status(404).json({
      error: "There is no experience with that id",
    });
  }
  const hostId = experience.hostId;
  const sessionAmount = experience.price * 100;
  const toBeTaxed = sessionAmount * 1.5;
  const tax = Math.ceil(toBeTaxed / 100);
  const amount = sessionAmount + tax;
  const name = customer.firstName;
  const email = customer.email;

  const capacity = experience.capacity;
  const ticketsBought = experience.boughtTickets;

  if (ticketsBought === capacity) {
    await experience.update({ fullCapacity: true });
    const checkWaitlist = await Waitlist.findOne({
      where: {
        customerId: customer.id,
        experienceId,
      },
    });

    if (checkWaitlist) {
      return res.status(403).json({ error: "already in the waitlist" });
    }
    await Waitlist.create({
      name,
      email,
      experienceId,
      customerId: customer.id,
    });
    return res.status(403).json({
      error: "Full capacity reached, we've added you to the waitlist",
    });
  }

  const paymentDetails = {
    amount,
    email,
    callback_url: test_callbackUrl,
    metadata: {
      amount,
      email,
      name,
    },
  };

  const data = await paystackApi.initializePayment(paymentDetails);
  const docHolder = await TicketHolder.create({
    experienceId,
    customerId: id,
    reference: data.reference,
    hostId,
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

  try {
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

    const actualAmount = amount / 100;
    const [payment, created] = await ExperienceTicket.findOrCreate({
      where: { paymentReference },
      defaults: { amount: actualAmount, email, name, paymentReference },
    });

    if (!created) {
      return res.status(402).json({ error: "Couldn't create a ticket" });
    }

    const findTicket = await TicketHolder.findOne({
      where: { reference: payment.paymentReference },
    });

    if (!findTicket) {
      return res
        .status(404)
        .json({ error: "ticket not found in ticketHolder" });
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

    if (!updatedTicket[0]) {
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
    const experience = await Experience.findOne({
      where: { id: experienceId },
    });

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
    await InfimuseAccount.create({
      amount: amount / 100,
      reference,
      transactionType: "Booking",
    });

    const hostId = experience.hostId;

    const tickets = experience.boughtTickets + 1;
    await experience.update({ boughtTickets: tickets });
    await findTicket.destroy();
    await experience.update({
      listingWorth: experience.price * tickets,
    });

    const communities = await Community.findOne({
      where: { hostId },
    });

    const toBeTaxed = actualAmount * 1.5;
    const tax = toBeTaxed / 100;
    const date = Date.now();
    await DST.create({
      hostId,
      amount: tax,
      date,
    });

    const ticketAmount = actualAmount - tax;

    const hostPlan = await HostPlan.findOne({
      where: { hostId },
    });
    let commissionPercentage;
    if (hostPlan.subscription === "freePlan") {
      commissionPercentage = 8;
      const commission = (commissionPercentage * ticketAmount) / 100;
      await ticket.update({ amount: ticketAmount - commission });
      const vat = 0.16 * commission;
      await Commission.create({
        amount: commission,
        reference: ticket.paymentReference,
        comissionType: "bookingFee",
        customerId: customer.id,
        hostId: hostId,
        VAT: vat,
      });
    } else if (hostPlan.subscription === "growth") {
      commissionPercentage = 5;
      const commission = (commissionPercentage * ticketAmount) / 100;
      await ticket.update({ amount: ticketAmount - commission });
      const vat = 0.16 * commission;
      await Commission.create({
        amount: commission,
        reference: ticket.paymentReference,
        comissionType: "bookingFee",
        customerId: customer.id,
        hostId: hostId,
        VAT: vat,
      });
    } else if (hostPlan.subscription === "professional") {
      commissionPercentage = 2.9;
      const commission = (commissionPercentage * ticketAmount) / 100;
      await ticket.update({ amount: ticketAmount - commission });
      const vat = 0.16 * commission;
      await Commission.create({
        amount: commission,
        reference: ticket.paymentReference,
        comissionType: "bookingFee",
        customerId: customer.id,
        hostId: hostId,
        VAT: vat,
      });
    }
    if (!communities) {
      return res.status(404).json({
        error:
          "Ticket sent to your email but the host has not created a community yet. We'll notify you when they do",
        data: payment,
      });
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

    return res.status(200).json({
      message: "Payment verified",
      data: payment,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
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

exports.ticketScan = async (req, res) => {
  const experienceId = req.params.experienceId;
  const qrcode = req.body.qrcode;

  const experience = await Experience.findOne({
    where: { id: experienceId },
  });
  if (!experience) {
    return res
      .status(404)
      .json({ error: "There is no experience with that id" });
  }
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

  const now = new Date();
  const tenHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
  if (experience.lastScannedAt && experience.lastScannedAt > tenHoursAgo) {
    return res.status(403).json({
      error:
        "This ticket has already been scanned for this session, can't scan twice",
      lastScannedAt: experience.lastScannedAt,
    });
  }
  await experience.update({
    lastScannedAt: now,
  });
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

exports.createFreeExperienceTickets = async (req, res) => {
  try {
    const experienceId = req.body.experienceId;

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorised" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const customerId = decodedToken.id;
    const customer = await Customer.findOne({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({ error: "customer not found" });
    }
    const experience = await Experience.findOne({
      where: { id: experienceId },
    });
    if (!experience) {
      return res.status(403).json({
        error: "There is no experience with that id",
      });
    }
    const hostId = experience.hostId;
    const sessionAmount = 0;
    const toBeTaxed = 0;
    const tax = 0;
    const amount = 0;
    const name = customer.firstName;
    const email = customer.email;
    const capacity = experience.capacity;
    const ticketsBought = experience.boughtTickets;

    if (ticketsBought === capacity) {
      await experience.update({ fullCapacity: true });
      const checkWaitlist = await Waitlist.findOne({
        where: {
          customerId: customer.id,
          experienceId,
        },
      });

      if (checkWaitlist) {
        return res.status(403).json({ error: "already in the waitlist" });
      }
      await Waitlist.create({
        name,
        email,
        freeExperienceId: experienceId,
        customerId: customer.id,
      });
      return res.status(403).json({
        error: "Full capacity reached, we've added you to the waitlist",
      });
    }
    const newTicket = await ExperienceTicket.create({
      email,
      name,
      customerId,
      experienceId,
    });
    const url = newTicket.ticketId;
    const title = experience.title;
    const listingDescription = experience.description;
    const date = experience.startDate;

    await new Email(
      customer,
      url,
      title,
      listingDescription,
      date,
      amount
    ).experienceTicket();

    return res.status(200).json({
      message: "Ticket sent to your email",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
