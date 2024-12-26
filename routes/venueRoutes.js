const express = require("express");
const router = express.Router();
const venuesController = require("../controllers/venueController");
const roleRestrict = require("../utils/midlewares/venueMiddleware");
router
  .route("/")
  .get(venuesController.getVenues)
  .post(roleRestrict, venuesController.createVenue);

router
  .get("/:id")
  .get(venuesController.getvenue)
  .put(venuesController.updateVenue)
  .delete(venuesController.deleteVenue);

module.exports = router;
