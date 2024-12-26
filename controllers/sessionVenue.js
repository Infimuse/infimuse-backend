const factory = require("./factory");
const db = require("../models");
const SessionVenue = db.sessionVenues;
const jwt = require("jsonwebtoken");
const secretKey = process.env.JWT_SECRET;

exports.editSessionVenue = factory.updateDoc(SessionVenue);
exports.createSessionVenue = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let hostId;
  try {
    const decodedToken = jwt.verify(token, secretKey);
    hostId = decodedToken.id;
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  try {
    const venue = await SessionVenue.create({
      name: req.body.name,
      locationPin: req.body.locationPin,
      hostId,
    });

    return res.status(201).json({ success: "true", venue });
  } catch (error) {
    console.log(error);
    return response.status(500).json("Internal secer error");
  }
};
exports.getSessionVenue = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let hostId;
  try {
    const decodedToken = jwt.verify(token, secretKey);
    hostId = decodedToken.id;
  } catch (err) {
    console.log("JWT verification failed:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  try {
    const venues = await SessionVenue.findAll({ where: { hostId } });
    return res.status(200).json({ success: true, venues });
  } catch (error) {
    console.log("Database query error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
