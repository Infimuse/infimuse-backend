const factory = require("./factory");
const db = require("./../models");
const asyncWrapper = require("../asyncWrapper");
const paystackApi = require("../paystackApi");
const jwt = require("jsonwebtoken");
const Email = require("../utils/email");
const testClassCallbackUrl =
  "http://localhost:8080/api/v1/guests/class-tickets/verify";
const classCallbackUrl =
  "https://whatever.lat/api/v1/guests/class-tickets/verify";

const testWorkshopCallbackUrl =
  "http://localhost:8080/api/v1/guests/workshop-tickets/verify";

const workshopCallbackUrl =
  "https://whatever.lat/api/v1/guests/workshop-tickets/verify";

const testPackageCallbackUrl =
  "http://localhost:8080/api/v1/guests/package-tickets/verify";

const packageCallbackUrl =
  "https://whatever.lat/api/v1/guests/package-tickets/verify";
const testExperienceCallbackUrl =
  "http://localhost:8080/api/v1/guests/experience-tickets/verify";

const experienceCallbackUrl =
  "https://whatever.lat/api/v1/guests/experience-tickets/verify";
const TicketHolder = db.ticketHolders;
const Guest = db.guests;
const secretKey = process.env.JWT_SECRET;
const ClassSession = db.classSessions;
const Workshop = db.workshops;
const Experience = db.experiences;

exports.getGuest = factory.getOneDoc(Guest);
exports.getAllGuests = factory.getAllDocs(Guest);
exports.updateGuest = factory.updateDoc(Guest);
exports.deleteGuest = factory.deleteDoc(Guest);

exports.guestClassTicket = asyncWrapper(async (req, res) => {
  const firstName = req.body.firstName;
  const email = req.body.email;
  const phone = req.body.phone;
  const classSessionId = req.body.sessionClassId;
  const classSession = await ClassSession.findOne({
    where: { id: classSessionId },
  });

  if (!email || !phone || !firstName) {
    return res.status(403).json({ error: "email/phone/name missing" });
  }

  const guest = await Guest.findOrCreate({
    where: { email },
    defaults: { email, phone, firstName },
  });
  const getGuest = await Guest.findOne({ where: { email } });
  if (!guest) {
    return res
      .status(500)
      .json({ error: "Guest could not be created, internal server error" });
  }

  // new Email(getGuest).guestWelcome();
  new Email(getGuest).guestWelcome();

  if (!classSession) {
    return res.status(404).json({
      error: "There is no classSession with that id",
    });
  }
  const hostId = classSession.hostId;
  const amount = classSession.price * 100;

  const paymentDetails = {
    amount,
    email,
    callback_url: classCallbackUrl,
    metadata: {
      amount,
      email,
      name: req.body.firstName,
    },
  };

  const data = await paystackApi.initializePayment(paymentDetails);
  const docHolder = await TicketHolder.create({
    classSessionId,
    customerId: req.body.customerId,
    reference: data.reference,
    hostId,
    guestId: getGuest.id,
  });

  return res.status(200).json({
    message: "Payment initialized successfully",
    data,
  });
});

// workshop ticket
exports.guestWorkshopTicket = asyncWrapper(async (req, res) => {
  const firstName = req.body.firstName;
  const email = req.body.email;
  const phone = req.body.phone;
  const workshopId = req.body.workshopId;
  const workshop = await Workshop.findOne({
    where: { id: workshopId },
  });

  if (!email || !phone || !firstName) {
    return res.status(403).json({ error: "email/phone/name missing" });
  }

  const guest = await Guest.findOrCreate({
    where: { email },
    defaults: { email, phone, firstName },
  });
  const getGuest = await Guest.findOne({ where: { email } });
  if (!guest) {
    return res
      .status(500)
      .json({ error: "Guest could not be created, internal server error" });
  }

  new Email(getGuest).guestWelcome();

  if (!workshop) {
    return res.status(404).json({
      error: "There is no workshop with that id",
    });
  }
  const hostId = workshop.hostId;
  const amount = workshop.price * 100;

  const paymentDetails = {
    amount,
    email,
    callback_url: workshopCallbackUrl,
    metadata: {
      amount,
      email,
      name: req.body.firstName,
    },
  };

  const data = await paystackApi.initializePayment(paymentDetails);
  const docHolder = await TicketHolder.create({
    workshopId,
    customerId: req.body.customerId,
    reference: data.reference,
    hostId,
    guestId: getGuest.id,
  });

  return res.status(200).json({
    message: "Payment initialized successfully",
    data,
  });
});

// package ticket
exports.guestPackageTicket = asyncWrapper(async (req, res) => {
  const firstName = req.body.firstName;
  const email = req.body.email;
  const phone = req.body.phone;
  const packageClassId = req.body.packageClassId;
  const package = await Workshop.findOne({
    where: { id: packageClassId },
  });

  if (!email || !phone || !firstName) {
    return res.status(403).json({ error: "email/phone/name missing" });
  }

  const guest = await Guest.findOrCreate({
    where: { email },
    defaults: { email, phone, firstName },
  });
  const getGuest = await Guest.findOne({ where: { email } });
  if (!guest) {
    return res
      .status(500)
      .json({ error: "Guest could not be created, internal server error" });
  }

  new Email(getGuest).guestWelcome();

  if (!package) {
    return res.status(404).json({
      error: "There is no package with that id",
    });
  }
  const hostId = package.hostId;
  const amount = package.price * 100;

  const paymentDetails = {
    amount,
    email,
    callback_url: packageCallbackUrl,
    metadata: {
      amount,
      email,
      name: req.body.firstName,
    },
  };

  const data = await paystackApi.initializePayment(paymentDetails);
  const docHolder = await TicketHolder.create({
    packageClassId,
    customerId: req.body.customerId,
    reference: data.reference,
    hostId,
    guestId: getGuest.id,
  });

  return res.status(200).json({
    message: "Payment initialized successfully",
    data,
  });
});

exports.guestExperienceTicket = asyncWrapper(async (req, res) => {
  const firstName = req.body.firstName;
  const email = req.body.email;
  const phone = req.body.phone;
  const experienceId = req.body.experienceId;
  const experience = await Experience.findOne({
    where: { id: experienceId },
  });

  if (!email || !phone || !firstName) {
    return res.status(403).json({ error: "email/phone/name missing" });
  }

  const guest = await Guest.findOrCreate({
    where: { email },
    defaults: { email, phone, firstName },
  });
  const getGuest = await Guest.findOne({ where: { email } });
  if (!guest) {
    return res
      .status(500)
      .json({ error: "Guest could not be created, internal server error" });
  }

  new Email(getGuest).guestWelcome();

  if (!experience) {
    return res.status(404).json({
      error: "There is no experience with that id",
    });
  }
  const hostId = experience.hostId;
  const amount = experience.price * 100;

  const paymentDetails = {
    amount,
    email,
    callback_url: experienceCallbackUrl,
    metadata: {
      amount,
      email,
      name: req.body.firstName,
    },
  };

  const data = await paystackApi.initializePayment(paymentDetails);
  const docHolder = await TicketHolder.create({
    experienceId,
    customerId: req.body.customerId,
    reference: data.reference,
    hostId,
    guestId: getGuest.id,
  });

  return res.status(200).json({
    message: "Payment initialized successfully",
    data,
  });
});
