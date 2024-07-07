const factory = require("./factory");
const db = require("./../models");

const Waitlist = db.waitlists;

exports.createWaitlist = factory.createDoc(Waitlist);
exports.getWaitlist = factory.getOneDoc(Waitlist);
exports.getAllWaitlists = factory.getAllDocs(Waitlist);
exports.updateWaitlist = factory.updateDoc(Waitlist);
exports.deleteWaitlist = factory.deleteDoc(Waitlist);
