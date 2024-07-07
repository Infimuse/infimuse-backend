const express = require("express");
const router = express.Router();

const waitlistController = require("../controllers/waitlistController");

router
  .route("/")
  .get(waitlistController.getAllWaitlists)
  .post(waitlistController.createWaitlist);

router
  .route("/:id")
  .put(waitlistController.updateWaitlist)
  .get(waitlistController.getWaitlist)
  .delete(waitlistController.deleteWaitlist);
module.exports = router;
