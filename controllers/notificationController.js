const factory = require("./factory");
const db = require("./../models");

const Notification = db.notifications;

exports.createNotification = factory.createDoc(Notification);
exports.getNotification = factory.getOneDoc(Notification);
exports.getAllNotifications = factory.getAllDocs(Notification);
exports.updateNotification = factory.updateDoc(Notification);
exports.deleteNotification = factory.deleteDoc(Notification);
