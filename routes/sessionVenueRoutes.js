const express = require("express");
const router = express.Router();
const sessionVenueController = require("../controllers/sessionVenue");

router
  .route("/")
  .post(sessionVenueController.createSessionVenue)
  .get(sessionVenueController.getSessionVenue);

module.exports = router;
