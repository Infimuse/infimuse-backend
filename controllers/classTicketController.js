const factory = require("./factory");
const db = require("./../models");
const Email = require("../utils/email");
const jwt = require("jsonwebtoken");
const qrcode = require("qrcode");
const asyncWrapper = require("../asyncWrapper");
const paystackApi = require("../paystackApi");
const testCallbackUrl = "http://localhost:8080/api/v1/class-tickets/verify";
const callbackUrl = "https://whatever.lat/api/v1/class-tickets/verify";
const Community = db.communities;
const TicketHolder = db.ticketHolders;
const ClassTicket = db.classTickets;
const Customer = db.customers;
const ClassSession = db.classSessions;
const PaymentTransaction = db.paymentTransactions;
const CancelTicket = db.cancelTickets;
const Host = db.hosts;
const Guest = db.guests;
const CommunityMembership = db.communityMemberships;
const group4discount = process.env.GROUP_OF_4_DISCOUNT;
const group2discount = process.env.GROUP_OF_2_DISCOUNT;
// exports.createClassTicket = factory.createDoc(ClassTicket);
exports.getClassTicket = factory.getOneDoc(ClassTicket);
exports.getAllClassTickets = factory.getAllDocs(ClassTicket);
exports.updateClassTicket = factory.updateDoc(ClassTicket);
exports.deleteClassTicket = factory.deleteDoc(ClassTicket);

exports.cancelTicket = async (req, res, next) => {
  const ticketId = req.params.ticketId;
  try {
    const ticket = await ClassTicket.findOne({ where: { ticketId: ticketId } });

    if (!ticket) {
      return res.status(403).json({ error: "Ticket not found" });
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
    const classTicket = ticket.ticketId;
    const listingId = ticket.sessionClassId;
    if (ticket.ticketStatus === "CANCELED") {
      return res
        .status(403)
        .json({ error: "You cannot cancel a ticket twice" });
    }
    const session = await ClassSession.findOne({
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

    const updateStatus = await ClassTicket.update(
      { ticketStatus: "CANCELED" },
      { where: { ticketId: ticketId } }
    );

    const canceledTicket = await CancelTicket.create({
      TicketId: classTicket,
      amount: listingAmount,
      hostId: host,
      customerId: customerId,
      classSessionId: listingId,
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
  const { email, name } = req.body;
  const classSessionId = req.body.sessionClassId;
  const classSession = await ClassSession.findOne({
    where: { id: classSessionId },
  });
  if (!classSession) {
    return res.status(403).json({
      error: "There is no classSession with that id",
    });
  }
  const hostId = classSession.hostId;
  const amount = classSession.price;

  const paymentDetails = {
    amount,
    email,
    callback_url: testCallbackUrl,
    metadata: {
      amount,
      email,
      name,
    },
  };

  const data = await paystackApi.initializePayment(paymentDetails);
  const docHolder = await TicketHolder.create({
    classSessionId,
    customerId: req.body.customerId,
    reference: data.reference,
    hostId,
  });

  return res.status(200).json({
    message: "Payment initialized successfully",
    data,
  });
});

exports.verifyPayment = asyncWrapper(async (req, res) => {
  try {
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
        .json({ error: "Ticket not found in the ticket holder" });
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

    if (!updatedTicket) {
      throw new Error("Failed to update the ticket");
    }

    const customer = await Customer.findOne({
      where: { id: findTicket.customerId },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    const ticket = await ClassTicket.findOne({
      where: { paymentReference: findTicket.reference },
    });

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    const url = ticket.ticketId;
    const classId = ticket.classSessionId;
    const classSession = await ClassSession.findOne({ where: { id: classId } });

    if (!classSession) {
      throw new Error("Class session not found");
    }

    const channelLink = classSession.channelLink;
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
    ).classTicket();

    const hostId = classSession.hostId;

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
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({ error: error.message });
  }
});

exports.ticketScan = async (req, res) => {
  const qrcode = req.body.qrcode;
  if (!qrcode) {
    return res.status(403).json({ error: "There is no qrcode to be scanned" });
  }

  const ticketId = await ClassTicket.findOne({
    where: { ticketId: qrcode },
  });
  if (!ticketId) {
    return res.status(403).json({ error: "No ticket with that ticketId" });
  }
  if (ticketId.ticketStatus != "ACTIVE") {
    return res.status(403).json({ error: "ticket status is not active" });
  }
  const model = await ClassSession.findOne({
    where: { id: ticketId.classSessionId },
  });
  if (ticketId.customerId) {
    const customerId = ticketId.customerId;
    const customer = await Customer.findOne({ where: { id: customerId } });

    if (!model) {
      return res.status(403).json({ error: "model not found" });
    }
    await model.update({
      attendance: model.attendance + 1,
    });

    return res.status(200).json({
      customer: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        ticketStatus: ticketId.status,
        amount: ticketId.amount,
        classTitle: model.title,
        classDescription: model.description,
        classStart: model.startDate,
        classDate: model.endDate,
        classStatus: model.status,
      },
    });
  }
  const guest = await Guest.findOne({ where: { id: ticketId.guestId } });
  if (!guest) {
    return res
      .status(403)
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
      classTitle: model.title,
      classDescription: model.description,
      classStart: model.startDate,
      classDate: model.endDate,
      classStatus: model.status,
    },
  });
};

exports.createGroupTicket = async (req, res) => {
  const email = req.body.email;
  const groupNumber = req.body.groupNumber;
  const phone = req.body.phone;
  const classSessionId = req.body.classSessionId;
  const firstName = req.body.firstName;
  const customerId = req.body.customerId;

  if (!email || !groupNumber || !phone) {
    return res.status(403).json({ error: "fill in the required entities" });
  }

  const classSession = await ClassSession.findOne({
    where: { id: classSessionId },
  });
  if (!classSession) {
    return res.status(403).json({ error: "Class not found" });
  }

  if (groupNumber === !2 || !4) {
    return res.status(403).json({ error: "only group of 2 or 4 allowed" });
  }
  if (groupNumber === 2) {
    const price = classSession.price * groupNumber;
    console.log(`price ${price}`);
    const groupComission = (group2discount / 100) * price;
    console.log(`groupComission ${groupComission}`);
    const toBePaid = price - groupComission;
    console.log(`toBePaid ${toBePaid}`);

    const paymentDetails = {
      amount: toBePaid,
      email,
      callback_url: callbackUrl,
      metadata: {
        amount: toBePaid,
        email,
        name: firstName,
      },
    };

    if (!customerId) {
      const guest = await Guest.findOrCreate({
        where: { email },
        defaults: { email, phone, firstName },
      });
      const getGuest = await Guest.findOne({ where: { email } });
      if (!guest) {
        return res.status(500).json({
          error: "Guest could not be created, internal server error",
        });
      }

      new Email(getGuest).guestWelcome();
      const data = await paystackApi.initializePayment(paymentDetails);
      const docHolder = await TicketHolder.create({
        classSessionId,
        reference: data.reference,
        groupNumber,
        guestId: guest.id,
        groupTicket: true,
      });

      return res.status(200).json({
        message: "Payment initialized successfully",
        data,
      });
    }
    const data = await paystackApi.initializePayment(paymentDetails);
    const docHolder = await TicketHolder.create({
      classSessionId,
      reference: data.reference,
      groupNumber,
      customerId,
      groupTicket: true,
    });

    return res.status(200).json({
      message: "Payment initialized successfully",
      data,
    });
  } else if (groupNumber === 4) {
    const price = classSession.price * groupNumber;
    const groupComission = group4discount * price;
    const toBePaid = (price - groupComission) * 100;

    const paymentDetails = {
      amount: toBePaid,
      email,
      callback_url: callbackUrl,
      metadata: {
        amount,
        email,
        name: firstName,
      },
    };

    if (!customerId) {
      const guest = await Guest.findOrCreate({
        where: { email },
        defaults: { email, phone, firstName },
      });
      const getGuest = await Guest.findOne({ where: { email } });
      if (!guest) {
        return res.status(500).json({
          error: "Guest could not be created, internal server error",
        });
      }

      new Email(getGuest).guestWelcome();
      const data = await paystackApi.initializePayment(paymentDetails);
      const docHolder = await TicketHolder.create({
        classSessionId,
        reference: data.reference,
        groupNumber,
        guestId: guest.id,
        groupTicket: true,
      });

      return res.status(200).json({
        message: "Payment initialized successfully",
        data,
      });
    }
    const data = await paystackApi.initializePayment(paymentDetails);
    const docHolder = await TicketHolder.create({
      classSessionId,
      reference: data.reference,
      groupNumber,
      customerId,
      groupTicket: true,
    });

    return res.status(200).json({
      message: "Payment initialized successfully",
      data,
    });
  }
};
