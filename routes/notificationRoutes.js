const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notificationController");

router
  .route("/")
  .get(notificationController.getAllNotifications)
  .post(notificationController.createNotification);

router
  .route("/:id")
  .put(notificationController.updateNotification)
  .get(notificationController.getNotification)
  .delete(notificationController.deleteNotification);
module.exports = router;
