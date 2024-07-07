const express = require("express");
const router = express.Router();
const venuesController = require("../controllers/venueController");
router
  .route("/")
  .get(venuesController.getVenues)
  .post(venuesController.createVenue);

router
  .get("/:id")
  .get(venuesController.getvenue)
  .put(venuesController.updateVenue)
  .delete(venuesController.deleteVenue);

module.exports = router;
