const factory = require("./factory");
const db = require("./../models");
const jwt = require("jsonwebtoken");
const Email = require("../utils/email");
const asyncWrapper = require("../asyncWrapper");
const paystackApi = require("../paystackApi");
const Customer = db.customers;
const PaymentTransaction = db.paymentTransactions;
const CancelTicket = db.cancelTickets;
const Workshop = db.workshops;
const TicketHolder = db.ticketHolders;
const WorkshopTicket = db.workshopTickets;
const Guest = db.guests;
const Community = db.communities;
const CommunityMembership = db.communityMemberships;

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
  const { email, callbackUrl, name, workshopId } = req.body;

  try {
    const workshop = await Workshop.findOne({ where: { id: workshopId } });

    if (!workshop) {
      return res
        .status(404)
        .json({ error: "There is no workshop with that id" });
    }

    const hostId = workshop.hostId;
    const amount = workshop.price;

    const paymentDetails = {
      amount,
      email,
      callback_url: callbackUrl,
      metadata: { amount, email, name },
    };

    const data = await paystackApi.initializePayment(paymentDetails);
    const docHolder = await db.ticketHolders.create({
      workshopId,
      customerId: req.body.customerId,
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

  const hostId = availableWorkshop.hostId;

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

exports.ticketScan = async (req, res) => {
  const qrcode = req.body.qrcode;
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
  const model = await Workshop.findOne({
    where: { id: ticketId.workshopId },
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
        workshopTitle: model.title,
        workshopDescription: model.description,
        workshopStart: model.startDate,
        workshopDate: model.endDate,
        workshopStatus: model.status,
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
      workshopTitle: model.title,
      workshopDescription: model.description,
      workshopStart: model.startDate,
      workshopDate: model.endDate,
      workshopStatus: model.status,
    },
  });
};
