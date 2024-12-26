const db = require("../models");
const Venue = db.venues;
const factory = require("./factory");
const jwt = require("jsonwebtoken");

exports.getvenue = factory.getOneDoc(Venue);
exports.updateVenue = factory.updateDoc(Venue);
exports.deleteVenue = factory.deleteDoc(Venue);
exports.getVenues = async (req, res) => {
  try {
    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Please login" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const hostId = decodedToken.id;

    const venuesByHost = await Venue.findAll({ where: { hostId } });
    return res
      .status(200)
      .json({ msg: "success", total: venuesByHost.length, venuesByHost });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.createVenue = async (req, res) => {
  try {
    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Please login" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const hostId = decodedToken.id;
    const name = req.body.name;
    const location = req.body.location;
    const accessibility = req.body.accessibility;
    const imageUrl1 = req.body.imageUrl1;
    const imageUrl2 = req.body.imageUrl2;
    const imageUrl3 = req.body.imageUrl3;
    const venueType = req.body.venueType;
    const capacity = req.body.capacity;
    const amenities = req.body.amenities;
    const noiseLeve = req.body.noiseLeve;
    const parking = req.body.parking;
    const additionalInfo = req.body.additionalInfo;
    const rules = req.body.rules;

    const venue = await Venue.create({
      name,
      location,
      accessibility,
      imageUrl1,
      imageUrl2,
      imageUrl3,
      venueType,
      capacity,
      amenities,
      noiseLeve,
      parking,
      additionalInfo,
      rules,
      hostId,
    });

    return res.status(201).json({ msg: "success", venue });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};
