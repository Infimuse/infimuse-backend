const factory = require("./factory");
const db = require("./../models");
const RefundTicket = db.refundTickets;

exports.createRefundTicket = factory.createDoc(RefundTicket);
exports.getAllRefundTicket = factory.getAllDocs(RefundTicket);
exports.getOneRefundTicket = factory.getOneDoc(RefundTicket);
exports.updateRefundTicket = factory.updateDoc(RefundTicket);
exports.deleteRefundTicket = factory.deleteDoc(RefundTicket);
