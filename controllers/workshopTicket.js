const factory = require("./factory");
const db = require("./../models");
const jwt = require("jsonwebtoken");
const Email = require("../utils/email");
const asyncWrapper = require("../asyncWrapper");
const paystackApi = require("../paystackApi");
const { where } = require("sequelize");
const Customer = db.customers;
const PaymentTransaction = db.paymentTransactions;
const CancelTicket = db.cancelTickets;
const Workshop = db.workshops;
const WorkshopClass = db.workshopClasses;
const TicketHolder = db.ticketHolders;
const WorkshopTicket = db.workshopTickets;
const Guest = db.guests;
const Community = db.communities;
const DST = db.DST;
const HostPlan = db.hostPlans;
const Commission = db.commissions;
const CommunityMembership = db.communityMemberships;
const callbackUrl = "http://localhost:8080/api/v1/workshop-tickets/verify";
const Waitlist = db.waitlists;
const InfimuseAccount = db.InfimuseAccount;

// exports.createWorkshopTicket = factory.createDoc(WorkshopTicket);
exports.getWorkshopTicket = factory.getOneDoc(WorkshopTicket);
exports.getAllWorkshopTickets = factory.getAllDocs(WorkshopTicket);
exports.updateWorkshopTicket = factory.updateDoc(WorkshopTicket);
exports.deleteWorkshopTicket = factory.deleteDoc(WorkshopTicket);

exports.cancelTicket = async (req, res, next) => {
  const ticketId = req.params.ticketId;
  try {
    const ticket = await WorkshopTicket.findOne({
      where: { ticketId: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }
    const userTicket = ticket.customerId;
    const customer = await Customer.findOne({ where: { id: userTicket } });
    const paymentId = ticket.paymentTransactionId;
    const payment = await PaymentTransaction.findOne({
      where: { id: paymentId },
    });
    const listingAmount = payment.amount;
    const customerId = payment.customerId;
    const phone = payment.phoneNumber;
    const host = ticket.hostId;
    const classTicket = ticket.ticketId;
    const listingId = ticket.workshopId;
    if (ticket.ticketStatus === "CANCELED") {
      return res
        .status(403)
        .json({ error: "You cannot cancel a ticket twice" });
    }

    const session = await Workshop.findOne({
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

    const updateStatus = await WorkshopTicket.update(
      { ticketStatus: "CANCELED" },
      { where: { ticketId: ticketId } }
    );

    const canceledTicket = await CancelTicket.create({
      TicketId: classTicket,
      amount: listingAmount,
      hostId: host,
      customerId: customerId,
      workshopId: listingId,
      phoneNumber: phone,
      refundPolicy: "flexible",
    });

    const url = canceledTicket.ticketId;
    const amount = canceledTicket.amount;
    const title = session.title;
    const listingDescription = session.description;

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
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.initializeBookingPayment = asyncWrapper(async (req, res) => {
  const workshopId = req.body.workshopId;

  try {
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
    const workshop = await Workshop.findOne({ where: { id: workshopId } });

    if (!workshop) {
      return res
        .status(404)
        .json({ error: "There is no workshop with that id" });
    }

    const hostId = workshop.hostId;
    const sessionAmount = workshop.price * 100;
    const toBeTaxed = sessionAmount * 1.5;
    const tax = Math.ceil(toBeTaxed / 100);
    const amount = sessionAmount + tax;
    const name = customer.firstName;
    const email = customer.email;

    const capacity = workshop.capacity;
    const ticketsBought = workshop.boughtTickets;

    if (ticketsBought === capacity) {
      await workshop.update({ fullCapacity: true });
      const checkWaitlist = await Waitlist.findOne({
        where: {
          customerId: customer.id,
          workshopId,
        },
      });

      if (checkWaitlist) {
        return res.status(403).json({ error: "already in the waitlist" });
      }
      await Waitlist.create({
        name,
        email,
        workshopId,
        customerId: customer.id,
      });
      return res.status(403).json({
        error: "Full capacity reached, we've added you to the waitlist",
      });
    }

    const paymentDetails = {
      amount,
      email: customer.email,
      callback_url: callbackUrl,
      metadata: { amount, email, name },
    };

    const data = await paystackApi.initializePayment(paymentDetails);
    const docHolder = await db.ticketHolders.create({
      workshopId,
      customerId: id,
      reference: data.reference,
      hostId,
    });

    return res.status(200).json({
      message: "Payment initialized successfully",
      data,
    });
  } catch (error) {
    console.error("Error:", error); // Log the error for debugging
    return res.status(500).json({ error: "Internal server error" });
  }
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
  const actualAmount = amount / 100;

  const [payment, created] = await WorkshopTicket.findOrCreate({
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
    return res.status(404).json({ error: "ticket not found in ticketHolder" });
  }

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
  if (!updatedTicket) {
    throw new Error("Failed to update the ticket");
  }

  const customer = await Customer.findOne({
    where: { id: findTicket.customerId },
  });
  const ticket = await WorkshopTicket.findOne({
    where: { paymentReference: findTicket.reference },
  });

  const url = ticket.ticketId;
  const workshopId = ticket.workshopId;

  const availableWorkshop = await Workshop.findOne({
    where: { id: workshopId },
  });
  if (!availableWorkshop) {
    throw new Error("Workshop not found");
  }
  const channelLink = availableWorkshop.channelLink;
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
  ).workshopTicket();
  await InfimuseAccount.create({
    amount: amount / 100,
    reference,
    transactionType: "Booking",
  });

  const hostId = availableWorkshop.hostId;
  const tickets = availableWorkshop.boughtTickets + 1;
  await availableWorkshop.update({ boughtTickets: tickets });
  await findTicket.destroy();
  await availableWorkshop.update({
    listingWorth: availableWorkshop.price * tickets,
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

  https: if (!communities) {
    return res.status(404).json({
      error:
        "Ticket sent to your email but the host has not created a community yet we'll notify you when they do",
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
});

exports.ticketScan = async (req, res) => {
  // /workshop-class/:workshopClassId/scan/
  const qrcode = req.body.qrcode;
  const workshopClassId = req.params.workshopClassId;

  const workshopClass = await WorkshopClass.findOne({
    where: { id: workshopClassId },
  });
  if (!workshopClass) {
    return res
      .status(404)
      .json({ error: "There is no workshopClass with that id" });
  }
  if (!qrcode) {
    return res.status(404).json({ error: "There is no qrcode to be scanned" });
  }
  const ticketId = await WorkshopTicket.findOne({
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
  if (
    workshopClass.lastScannedAt &&
    workshopClass.lastScannedAt > tenHoursAgo
  ) {
    return res.status(403).json({
      error:
        "This ticket has already been scanned for this session, can't scan twice",
      lastScannedAt: workshopClass.lastScannedAt,
    });
  }
  await workshopClass.update({
    lastScannedAt: now,
  });

  const workshop = await Workshop.findOne({
    where: { id: ticketId.workshopId },
  });
  if (!workshop) {
    return res.status(404).json({ error: "workshop not found" });
  }

  if (ticketId.customerId) {
    const customerId = ticketId.customerId;
    const customer = await Customer.findOne({ where: { id: customerId } });
    if (!customer) {
      return res.status({ error: "Ticket found but not a customer" });
    }
    await workshopClass.update({
      attendance: workshopClass.attendance + 1,
    });
    return res.status(200).json({
      customer: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        ticketStatus: ticketId.status,
        amount: ticketId.amount,
        workshopTitle: workshop.title,
        workshopDescription: workshop.description,
        workshopStart: workshop.startDate,
        workshopDate: workshop.endDate,
        workshopStatus: workshop.status,
      },
    });
  }
  const guest = await Guest.findOne({ where: { id: ticketId.guestId } });
  if (!guest) {
    return res
      .status(404)
      .json({ error: "ticket found but not as a guest or a customer" });
  }
  await workshop.update({
    attendance: workshop.attendance + 1,
  });
  return res.status(200).json({
    guest: {
      firstName: guest.firstName,
      email: guest.email,
      ticketStatus: ticketId.status,
      amount: ticketId.amount,
      workshopTitle: workshop.title,
      workshopDescription: workshop.description,
      workshopStart: workshop.startDate,
      workshopDate: workshop.endDate,
      workshopStatus: workshop.status,
    },
  });
};

exports.createFreeWorkshopTicket = async (req, res) => {
  try {
    const workshopId = req.body.workshopId;

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
    const workshop = await Workshop.findOne({
      where: { id: workshopId },
    });
    if (!workshop) {
      return res.status(403).json({
        error: "There is no workshop with that id",
      });
    }
    const hostId = workshop.hostId;
    const sessionAmount = 0;
    const toBeTaxed = 0;
    const tax = 0;
    const amount = 0;
    const name = customer.firstName;
    const email = customer.email;
    const capacity = workshop.capacity;
    const ticketsBought = workshop.boughtTickets;

    if (ticketsBought === capacity) {
      await workshop.update({ fullCapacity: true });
      const checkWaitlist = await Waitlist.findOne({
        where: {
          customerId: customer.id,
          workshopId,
        },
      });

      if (checkWaitlist) {
        return res.status(403).json({ error: "already in the waitlist" });
      }
      await Waitlist.create({
        name,
        email,
        workshopId,
        customerId: customer.id,
      });
      return res.status(403).json({
        error: "Full capacity reached, we've added you to the waitlist",
      });
    }
    const newTicket = await WorkshopTicket.create({
      email,
      name,
      customerId,
      workshopId,
    });
    const url = newTicket.ticketId;
    const title = workshop.title;
    const listingDescription = workshop.description;
    const date = workshop.startDate;

    await new Email(
      customer,
      url,
      title,
      listingDescription,
      date,
      amount
    ).workshopTicket();

    return res.status(200).json({
      message: "Ticket sent to your email",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
