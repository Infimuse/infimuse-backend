const factory = require("./factory");
const db = require("./../models");
const jwt = require("jsonwebtoken");
const Email = require("../utils/email");
const asyncWrapper = require("../asyncWrapper");
const paystackApi = require("../paystackApi");
const callbackUrl = "http://localhost:8080/api/v1/package-tickets/verify";
const TicketHolder = db.ticketHolders;
const Customer = db.customers;
const PackageTicket = db.packageTickets;
const PaymentTransaction = db.paymentTransactions;
const CancelTicket = db.cancelTickets;
const PackageClass = db.packageClasses;
const Guest = db.guests;
const HostPlan = db.hostPlans;
const Commission = db.commissions;
const Community = db.communities;
const PackageSession = db.packageSessions;
const Waitlist = db.waitlists;
const DST = db.DST;
const CommunityMembership = db.communityMemberships;
const InfimuseAccount = db.InfimuseAccount;

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
  const sessionAmount = Math.floor(package.price * 100);
  const toBeTaxed = Math.floor(sessionAmount * 1.5);
  const tax = Math.ceil(toBeTaxed / 100);
  const amount = sessionAmount + tax;
  const name = customer.firstName;
  const email = customer.email;

  const capacity = package.capacity;
  const ticketsBought = package.boughtTickets;

  if (ticketsBought === capacity) {
    await package.update({ fullCapacity: true });
    const checkWaitlist = await Waitlist.findOne({
      where: {
        customerId: customer.id,
        packageClassId: packageId,
      },
    });

    if (checkWaitlist) {
      return res.status(403).json({ error: "already in the waitlist" });
    }
    await Waitlist.create({
      name,
      email,
      packageClassId: packageId,
      customerId: customer.id,
    });
    return res.status(403).json({
      error: "Full capacity reached, we've added you to the waitlist",
    });
  }

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
    customerId: customer.id,
    reference: data.reference,
    hostId: package.hostId,
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
    const [payment, created] = await PackageTicket.findOrCreate({
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
        .json({ error: "Ticket not found in TicketHolder" });
    }

    const [updatedRows] = await PackageTicket.update(
      {
        hostId: findTicket.hostId,
        customerId: findTicket.customerId,
        packageClassId: findTicket.packageClassId,
      },
      {
        where: { paymentReference: findTicket.reference },
      }
    );

    if (updatedRows === 0) {
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
      throw new Error("PackageClass not found");
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
    await InfimuseAccount.create({
      amount: amount / 100,
      reference,
      transactionType: "Booking",
    });

    const hostId = packageClass.hostId;

    const tickets = packageClass.boughtTickets + 1;
    await packageClass.update({ boughtTickets: tickets });
    await findTicket.destroy();
    await packageClass.update({
      listingWorth: packageClass.price * tickets,
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
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

exports.ticketScan = async (req, res) => {
  const packageClassId = req.params.packageClassId;
  const qrcode = req.body.qrcode;

  const packageClass = await PackageSession.findOne({
    where: { id: packageClassId },
  });
  if (!packageClass) {
    return res
      .status(404)
      .json({ error: "There is no packageClass with that id" });
  }

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

  const now = new Date();
  const tenHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
  if (packageClass.lastScannedAt && packageClass.lastScannedAt > tenHoursAgo) {
    return res.status(403).json({
      error:
        "This ticket has already been scanned for this session, can't scan twice",
      lastScannedAt: packageClass.lastScannedAt,
    });
  }
  await packageClass.update({
    lastScannedAt: now,
  });
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

exports.createFreePackageTickets = async (req, res) => {
  try {
    const packageClassId = req.body.packageClassId;

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
    const packageClass = await PackageClass.findOne({
      where: { id: packageClassId },
    });
    if (!packageClass) {
      return res.status(403).json({
        error: "There is no packageClass with that id",
      });
    }
    const hostId = packageClass.hostId;
    const sessionAmount = 0;
    const toBeTaxed = 0;
    const tax = 0;
    const amount = 0;
    const name = customer.firstName;
    const email = customer.email;
    const capacity = packageClass.capacity;
    const ticketsBought = packageClass.boughtTickets;

    if (ticketsBought === capacity) {
      await packageClass.update({ fullCapacity: true });
      const checkWaitlist = await Waitlist.findOne({
        where: {
          customerId: customer.id,
          packageClassId,
        },
      });

      if (checkWaitlist) {
        return res.status(403).json({ error: "already in the waitlist" });
      }
      await Waitlist.create({
        name,
        email,
        packageClassId,
        customerId: customer.id,
      });
      return res.status(403).json({
        error: "Full capacity reached, we've added you to the waitlist",
      });
    }
    const newTicket = await PackageTicket.create({
      email,
      name,
      customerId,
      packageClassId,
    });
    const url = newTicket.ticketId;
    const title = packageClass.title;
    const listingDescription = packageClass.description;
    const date = packageClass.startDate;

    await new Email(
      customer,
      url,
      title,
      listingDescription,
      date,
      amount
    ).packageTicket();

    return res.status(200).json({
      message: "Ticket sent to your email",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
