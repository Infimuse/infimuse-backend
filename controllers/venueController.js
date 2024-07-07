const db = require("../models");
const Venue = db.venues;
const factory = require("./factory");

exports.createVenue = factory.createDoc(Venue);
exports.getVenues = factory.getAllDocs(Venue);
exports.getvenue = factory.getOneDoc(Venue);
exports.updateVenue = factory.updateDoc(Venue);
exports.deleteVenue = factory.deleteDoc(Venue);
