const factory = require("./factory");
const db = require("./../models");
const jwt = require("jsonwebtoken");
const Email = require("../utils/email");
const asyncWrapper = require("../asyncWrapper");
const paystackApi = require("../paystackApi");
const TicketHolder = db.ticketHolders;
const Customer = db.customers;
const PackageTicket = db.packageTickets;
const PaymentTransaction = db.paymentTransactions;
const CancelTicket = db.cancelTickets;
const PackageClass = db.packageClasses;
const Guest = db.guests;
const Community = db.communities;
const CommunityMembership = db.communityMemberships;

// exports. = factory.createDoc(PackageTicket);
exports.getPackageTicket = factory.getOneDoc(PackageTicket);
exports.getAllPackageTickets = factory.getAllDocs(PackageTicket);
exports.updatePackageTicket = factory.updateDoc(PackageTicket);
exports.deletePackageTicket = factory.deleteDoc(PackageTicket);

exports.cancelTicket = async (req, res, next) => {
  const ticketId = req.params.ticketId;
  try {
    const ticket = await PackageTicket.findOne({
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
    const listingId = ticket.packageClassId;
    if (ticket.ticketStatus === "CANCELED") {
      return res
        .status(403)
        .json({ error: "You cannot cancel a ticket twice" });
    }

    const session = await PackageClass.findOne({
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

    const updateStatus = await PackageTicket.update(
      { ticketStatus: "CANCELED" },
      { where: { ticketId: ticketId } }
    );

    //  const date = session.startDate;

    const canceledTicket = await CancelTicket.create({
      TicketId: classTicket,
      amount: listingAmount,
      hostId: host,
      customerId: customerId,
      packageClassId: listingId,
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
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.initializeBookingPayment = asyncWrapper(async (req, res) => {
  const { email, callbackUrl, name } = req.body;
  const packageId = req.body.packageClassId;
  const package = await PackageClass.findOne({
    where: { id: packageId },
  });
  if (!package) {
    return res.status(404).json({
      error: "There is no package with that id",
    });
  }
  const hostId = package.hostId;
  const amount = package.price;

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
    packageClassId: packageId,
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

  if (!updatedTicket) {
    throw new Error("Failed to update the ticket");
  }

  const customer = await Customer.findOne({
    where: { id: findTicket.customerId },
  });
  const ticket = await PackageTicket.findOne({
    where: { paymentReference: findTicket.reference },
  });
  const url = ticket.ticketId;
  const packageClassId = ticket.packageClassId;

  const packageClass = await PackageClass.findOne({
    where: { id: packageClassId },
  });
  if (!packageClass) {
    throw new Error("packageClass not found");
  }
  const channelLink = packageClass.channelLink;
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
  ).packageTicket();

  const hostId = packageClass.hostId;

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

  const ticketId = await PackageTicket.findOne({
    where: { ticketId: qrcode },
  });
  if (!ticketId) {
    return res.status(404).json({ error: "No ticket with that ticketId" });
  }
  if (ticketId.ticketStatus != "ACTIVE") {
    return res.status(403).json({ error: "ticket status is not active" });
  }
  const model = await PackageClass.findOne({
    where: { id: ticketId.packageClassId },
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
        packageTitle: model.title,
        packageDescription: model.description,
        packageStart: model.startDate,
        packageDate: model.endDate,
        packageStatus: model.status,
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
      packageTitle: model.title,
      packageDescription: model.description,
      packageStart: model.startDate,
      packageDate: model.endDate,
      packageStatus: model.status,
    },
  });
};
