const asyncWrapper = require("../asyncWrapper");
const paystackApi = require("../paystackApi");
const db = require("./../models");
const Email = require("../utils/email");
const TicketHolder = db.ticketHolders;
const Guest = db.guests;
const WorkshopTicket = db.workshopTickets;
const ClassTicket = db.classTickets;
const PackageTicket = db.packageTickets;
const ExperienceTicket = db.experienceTickets;

exports.verifyClassPayment = asyncWrapper(async (req, res) => {
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
    return res
      .status(404)
      .json({ error: "ticket not found in the ticket holder" });
  }

  const updatedTicket = await ClassTicket.update(
    {
      hostId: findTicket.hostId,
      guestId: findTicket.guestId,
      classSessionId: findTicket.classSessionId,
    },
    {
      where: { paymentReference: findTicket.reference },
    }
  );

  const customer = await Guest.findOne({
    where: { id: findTicket.guestId },
  });

  const ticket = await ClassTicket.findOne({
    where: { paymentReference: findTicket.reference },
  });
  const url = ticket.ticketId;
  const qrCodeURL = ticket.ticketId;
  new Email(customer, url, null, null, null, null, qrCodeURL).classTicket();

  await findTicket.destroy();

  return res.status(200).json({
    message: "Payment verified",
    data: payment,
  });
});

// workshop verify
exports.verifyWorkshopPayment = asyncWrapper(async (req, res) => {
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

  if (findTicket) {
    const updatedTicket = await WorkshopTicket.update(
      {
        hostId: findTicket.hostId,
        guestId: findTicket.guestId,
        workshopId: findTicket.workshopId,
      },
      {
        where: { paymentReference: findTicket.reference },
      }
    );

    const customer = await Guest.findOne({
      where: { id: findTicket.guestId },
    });
    const ticket = await WorkshopTicket.findOne({
      where: { paymentReference: findTicket.reference },
    });
    const url = ticket.ticketId;
    const qrCodeURL = ticket.ticketId;
    new Email(
      customer,
      url,
      null,
      null,
      null,
      null,
      qrCodeURL
    ).workshopTicket();
    await findTicket.destroy();
  }

  return res.status(200).json({
    message: "Payment verified",
    data: payment,
  });
});

// Package ticket
exports.verifyPackagePayment = asyncWrapper(async (req, res) => {
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

  if (findTicket) {
    const updatedTicket = await PackageTicket.update(
      {
        hostId: findTicket.hostId,
        guestId: findTicket.guestId,
        packageClassId: findTicket.packageClassId,
      },
      {
        where: { paymentReference: findTicket.reference },
      }
    );

    const customer = await Guest.findOne({
      where: { id: findTicket.guestId },
    });
    const ticket = await PackageTicket.findOne({
      where: { paymentReference: findTicket.reference },
    });
    const url = ticket.ticketId;
    const qrCodeURL = ticket.ticketId;
    new Email(customer, url, null, null, null, null, qrCodeURL).packageTicket();
    await findTicket.destroy();
  }

  return res.status(200).json({
    message: "Payment verified",
    data: payment,
  });
});

// experience verify

exports.verifyExperiencePayment = asyncWrapper(async (req, res) => {
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
      guestId: findTicket.guestId,
      experienceId: findTicket.experienceId,
    },
    {
      where: { paymentReference: findTicket.reference },
    }
  );

  const customer = await Guest.findOne({
    where: { id: findTicket.guestId },
  });
  const ticket = await ExperienceTicket.findOne({
    where: { paymentReference: findTicket.reference },
  });
  const url = ticket.ticketId;
  const qrCodeURL = ticket.ticketId;
  new Email(
    customer,
    url,
    null,
    null,
    null,
    null,
    qrCodeURL
  ).experienceTicket();
  await findTicket.destroy();

  return res.status(200).json({
    message: "Payment verified",
    data: payment,
  });
});
