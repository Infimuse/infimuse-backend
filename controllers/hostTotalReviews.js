const factory = require("./factory");
const db = require("./../models");
const HostTotalReviews = db.hostTotalReviews;

exports.createHostTotalReviews = factory.createDoc(HostTotalReviews);
exports.getAllHostTotalReviews = factory.getAllDocs(HostTotalReviews);
exports.getOneHostTotalReviews = factory.getOneDoc(HostTotalReviews);
exports.updateHostTotalReviews = factory.updateDoc(HostTotalReviews);
exports.deleteHostTotalReviews = factory.deleteDoc(HostTotalReviews);
