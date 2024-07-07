const express = require("express");
const router = express.Router();

const Location = require("../controllers/locationController");

router.route("/").get(Location.getAllLocations).post(Location.createLocation);

router
  .route("/:id")
  .put(Location.updateLocation)
  .get(Location.getLocation)
  .delete(Location.deleteLocation);
module.exports = router;
