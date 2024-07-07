const db = require("../models");
const CancelTicket = db.cancelTickets;
const factory = require("./factory");
exports.getAllCanceledTickets = factory.getAllDocs(CancelTicket);
