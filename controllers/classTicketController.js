const factory = require("./factory");
const db = require("./../models");
const Email = require("../utils/email");
const jwt = require("jsonwebtoken");
const qrcode = require("qrcode");
const testKey = process.env.PAYSTACK_TEST_KEY;
const liveKey = process.env.PAYSTACK_LIVE_KEY;
const asyncWrapper = require("../asyncWrapper");
const paystackApi = require("../paystackApi");
const { where } = require("sequelize");
const testCallbackUrl = "http://localhost:8079/api/v1/class-tickets/verify";
const callbackUrl = "https://whatever.lat/api/v1/class-tickets/verify";
const Community = db.communities;
const Paystack = require("paystack-sdk").Paystack;
const paystack = new Paystack(liveKey);
const TicketHolder = db.ticketHolders;
const ClassTicket = db.classTickets;
const Customer = db.customers;
const HostInvoice = db.hostinvoices;
const ClassSession = db.classSessions;
const PaymentTransaction = db.paymentTransactions;
const CancelTicket = db.cancelTickets;
const Host = db.hosts;
const Subaccount = db.subAccounts;
const HostPlan = db.hostPlans;
const Guest = db.guests;
const Waitlist = db.waitlists;
const DST_Tax = process.env.DST_Tax;
const InfimuseAccount = db.InfimuseAccount;
const Commission = db.commissions;
const CommunityMembership = db.communityMemberships;
const group4discount = process.env.GROUP_OF_4_DISCOUNT;
const group2discount = process.env.GROUP_OF_2_DISCOUNT;
// exports.createClassTicket = factory.createDoc(ClassTicket);
const DST = db.DST;
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
  
  const hostSubaccount = await Subaccount.findOne({
    where: { hostId }
  });

  if (!hostSubaccount) {
    return res.status(400).json({ 
      error: "Host has not set up a Paystack subaccount" 
    });
  }

  // Calculate base amount and DST tax
  const sessionAmount = classSession.price * 100;
  const toBeTaxed = sessionAmount * 1;
  const tax = toBeTaxed
  const totalAmount = sessionAmount
  const name = customer.firstName;
  const email = customer.email;

  // Get host's plan and commission rate
  const hostPlan = await HostPlan.findOne({
    where: { hostId }
  });

  let commissionPercentage;
  switch(hostPlan.subscription) {
    case "freePlan":
      commissionPercentage = 8;
      break;
    case "growth":
      commissionPercentage = 5;
      break;
    case "professional":
      commissionPercentage = 2.9;
      break;
    default:
      commissionPercentage = 8; // Default to highest rate
  }

  // Calculate amounts after DST tax
  const amountAfterTax = sessionAmount;
  const hostShare = Math.floor((100 - commissionPercentage) * 100) / 100; // Convert to percentage for split

  const split = await paystack.split.create({
    name: "Host Commission Split",
    type: "percentage",
    currency: "KES",  // Change to your currency if needed
    subaccounts: [
      {
        subaccount: hostSubaccount.paystack_subaccount_code,
        share: hostShare
      }
    ],
    bearer_type: "account"
  });
  console.log(`split: ${split}`);
  
  const paymentDetails = {
    amount: totalAmount,
    email,
    callback_url: testCallbackUrl,
    metadata: {
      amount: totalAmount,
      sessionAmount,
      tax,
      email,
      name,
      hostId,
      commissionPercentage,
      hostPlanType: hostPlan.subscription
    },
    split:split.data
  };

  const data = await paystackApi.initializePayment(paymentDetails);
  
  const docHolder = await TicketHolder.create({
    classSessionId,
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
  try {
    const reference = req.query.reference;

    if (!reference) {
      throw new Error("Missing transaction reference");
    }
    const {
      data: {
        metadata: { 
          email, 
          amount, 
          sessionAmount, // Original class session amount
          tax, // DST tax amount
          name,
          hostId,
          commissionPercentage,
          hostPlanType,
          split_data
        },
        reference: paymentReference,
        status: transactionStatus,
        
      },
    } = await paystackApi.verifyPayment(reference);

    if (transactionStatus !== "success") {
      throw new Error(`Transaction: ${transactionStatus}`);
    }

    const actualAmount = amount / 100;
    const sessionActualAmount = sessionAmount / 100;
    const actualTax = tax / 100;

    // Create the class ticket
    const [payment, created] = await ClassTicket.findOrCreate({
      where: { paymentReference },
      defaults: { 
        amount: sessionActualAmount, // Store original session amount
        email, 
        name, 
        paymentReference 
      },
    });

    if (!created) {
      return res.status(402).json({ error: "Couldn't create a ticket" });
    }

    const findTicket = await TicketHolder.findOne({
      where: { reference: payment.paymentReference },
    });

    if (!findTicket) {
      return res.status(404).json({ error: "Ticket not found in the ticket holder" });
    }

    // Update ticket with session details
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

    const classId = ticket.classSessionId;
    const classSession = await ClassSession.findOne({ where: { id: classId } });

    if (!classSession) {
      throw new Error("Class session not found");
    }

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    // Create platform account record
    await InfimuseAccount.create({
      amount: actualAmount,
      reference,
      transactionType: "Booking",
    });

    // Update class session details
    const tickets = classSession.boughtTickets + 1;
    await classSession.update({ 
      boughtTickets: tickets,
      listingWorth: classSession.price * tickets
    });

    // Remove from ticket holder
    await findTicket.destroy();

    // Record DST
    await DST.create({
      hostId,
      amount: actualTax,
      date: Date.now(),
    });

    // Calculate and record commission
    const commission = (commissionPercentage * sessionActualAmount) / 100;
    const vat = 0.16 * classSession.price;
    
    await Commission.create({
      amount: commission,
      reference: ticket.paymentReference,
      comissionType: "bookingFee",
      customerId: customer.id,
      hostId: hostId,
      VAT: vat,
    });

    const splitDetails = await paystack.split.fetch(reference)

    console.log(`split_data: ${splitDetails}`);

    // await HostInvoice.create({
    //   hostName: Host.firstName,
    //   subAccountCode: Host.subAccountCode,
    //   paymentReference: paymentReference,
    //   amountPaid: sessionActualAmount,
    //   bookingFee: split_data.platform_amount / 100,
    //   sessionTitle: classSession.title,
    //   vat: vat,
    //   infimuseAmount: split_data.platform_amount / 100,
    //   totalPayable: split_data.subaccount_amount / 100
    // });

    

    const ticketId = ticket.ticketId;
    const channelLink = classSession.channelLink;

    const emailInstance = new Email(
      customer,
      ticketId, 
      classSession.title,
      classSession.description,
      classSession.startDate,
      sessionActualAmount,
      null,
      ticketId,
      channelLink
    );
    
    await emailInstance.classTicket();

    // Handle community membership
    const communities = await Community.findOne({
      where: { hostId },
    });

    if (!communities) {
      return res.status(404).json({
        error: "Ticket sent to your email but the host has not created a community yet we'll notify you when they do",
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
console.log(ticketId)
    return res.status(200).json({
      message: "Payment verified",
      data: payment,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
});
exports.ticketScan = async (req, res) => {
  const qrcode = req.body.qrcode;
  const classId = req.params.classId;

  const classSession = await ClassSession.findOne({
    where: { id: classId },
  });
  if (!classSession) {
    return res
      .status(404)
      .json({ error: "There is no classSession with that id" });
  }

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
  const now = new Date();
  const tenHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
  if (classSession.lastScannedAt && classSession.lastScannedAt > tenHoursAgo) {
    return res.status(403).json({
      error:
        "This ticket has already been scanned for this session, can't scan twice",
      lastScannedAt: classSession.lastScannedAt,
    });
  }
  await classSession.update({
    lastScannedAt: now,
  });
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
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const customerId = decodedToken.id;
    const customer = await Customer.findOne({ where: { id: customerId } });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const email = customer.email;
    const groupNumber = req.body.groupNumber;
    const phone = customer.phoneNumber;
    const classSessionId = req.body.classSessionId;
    const firstName = customer.firstName;


    const classSession = await ClassSession.findOne({
      where: { id: classSessionId },
    });
    if (!classSession) {
      return res.status(404).json({ error: "Class not found" });
    }

    if (![2, 4].includes(groupNumber)) {
      return res
        .status(400)
        .json({ error: "Only groups of 2 or 4 are allowed" });
    }

    // Calculate price and payment details
    const price = classSession.price * groupNumber;
    const groupDiscount =
      groupNumber === 2
        ? (group2discount / 100) * price
        : (group4discount / 100) * price;
    const toBePaid = price - groupDiscount;

    const paymentDetails = {
      amount: toBePaid,
      email,
      currency:"KES",
      callback_url: testCallbackUrl,
      metadata: {
        amount: toBePaid,
        email,
        name: firstName,
      },
    };

    // Handle guest creation for non-registered users
    let guestId = null;
    if (!customerId) {
      const [guest, created] = await Guest.findOrCreate({
        where: { email },
        defaults: { email, phone, firstName },
      });
      guestId = guest.id;
      if (created) {
        new Email(guest).guestWelcome();
      }
    }

    // Initialize payment
    const paymentData = await paystackApi.initializePayment(paymentDetails);

    // Create group tickets in the database
    const tickets = [];
    for (let i = 0; i < groupNumber; i++) {
      const ticket = await TicketHolder.create({
        classSessionId,
        reference: paymentData.reference,
        groupNumber,
        groupTicket: true,
        customerId: customerId || null,
        guestId: guestId || null,
      });
      tickets.push(ticket);
    }

    // Send tickets to customer via email
    await new Email(customer, tickets).groupTicket();

    return res.status(200).json({
      message: "Payment initialized successfully and tickets sent",
      data: paymentData,
    });
  } catch (error) {
    console.error("Error creating group ticket:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


exports.createFreeClassTickets = async (req, res) => {
  try {
    const classSessionId = req.body.classSessionId;

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
    const classSession = await ClassSession.findOne({
      where: { id: classSessionId },
    });
    if (!classSession) {
      return res.status(403).json({
        error: "There is no classSession with that id",
      });
    }
    const hostId = classSession.hostId;
    const sessionAmount = 0;
    const toBeTaxed = 0;
    const tax = 0;
    const amount = 0;
    const name = customer.firstName;
    const email = customer.email;
    const capacity = classSession.capacity;
    const ticketsBought = classSession.boughtTickets;

    if (ticketsBought === capacity) {
      await classSession.update({ fullCapacity: true });
      const checkWaitlist = await Waitlist.findOne({
        where: {
          customerId: customer.id,
          classSessionId,
        },
      });

      if (checkWaitlist) {
        return res.status(403).json({ error: "already in the waitlist" });
      }
      await Waitlist.create({
        name,
        email,
        classSessionId,
        customerId: customer.id,
      });
      return res.status(403).json({
        error: "Full capacity reached, we've added you to the waitlist",
      });
    }
    const newTicket = await ClassTicket.create({
      email,
      name,
      customerId,
      classSessionId,
    });
    const url = newTicket.ticketId;
    const title = classSession.title;
    const listingDescription = classSession.description;
    const date = classSession.startDate;

    await new Email(
      customer,
      url,
      title,
      listingDescription,
      date,
      amount
    ).classTicket();

    return res.status(200).json({
      message: "Ticket sent to your email",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
