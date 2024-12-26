const db = require("../models");
const SessionBooking = db.sessionBookings;
const jwt = require("jsonwebtoken");
const secretKey = process.env.JWT_SECRET;
const PackageSession = db.packageSessions;
const Customer = db.customers;
const Host = db.hosts;
const Availability = db.availabilities;

exports.createSessionBooking = async (req, res) => {
  const {
    packageSessionId,
    customVenue,
    venueName,
    locationPin,
    time,
    date,
    availabilityId,
  } = req.body;

  if (!availabilityId) {
    return res
      .status(403)
      .json({ error: "you have to take a slot from the available dates" });
  }
  const availability = await Availability.findOne({
    where: { id: availabilityId },
  });
  if (!availability) {
    res.status(404).json({ error: "slot not found" });
  }
  if (availability.isBooked) {
    return res.status(403).json({
      error:
        "that slot is scheduled for someone else please select a different one",
    });
  }

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Token missing" });
  }

  let customerId;
  try {
    const decodedToken = jwt.verify(token, secretKey);
    customerId = decodedToken.id;
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }

  try {
    if (customVenue && (!venueName || !locationPin)) {
      console.log("Validation failed for custom venue");
      return res.status(400).json({
        error: "For custom venue, both venueName and locationPin are required.",
      });
    }

    const customer = await Customer.findOne({ where: { id: customerId } });
    if (!customer) {
      console.log("Customer not found with ID:", customerId);
      return res.status(404).json({ error: "Customer not found" });
    }

    const package = await PackageSession.findOne({
      where: { id: packageSessionId },
    });
    if (!package) {
      console.log("Package session not found with ID:", packageSessionId);
      return res.status(404).json({ error: "Package session not found" });
    }

    // Create booking
    const booking = await SessionBooking.create({
      userFirstName: customer.firstName,
      userLastName: customer.lastName,
      userEmail: customer.email,
      userPhone: customer.phone,
      venueName,
      locationPin,
      packageSessionId,
      hostId: package.hostId,
      customerId,
      time: availability.slot,
      date: availability.date,
      customVenue,
      availabilityId,
    });

    await availability.update({ isBooked: true });

    console.log("Booking created successfully:", booking);
    return res.status(201).json({ msg: "Success", booking });
  } catch (error) {
    console.error("An error occurred during session booking:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
