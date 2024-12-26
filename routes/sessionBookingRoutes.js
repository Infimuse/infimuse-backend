const express = require("express");
const router = express.Router();
const sessionBookingController = require("../controllers/sessionBooking");

router.route("/").post(sessionBookingController.createSessionBooking);

module.exports = router;
