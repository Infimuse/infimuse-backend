const express = require("express");
const router = express.Router();
const hostReviewController = require("./../controllers/hostReview");
const hostAuthController = require("./../controllers/hostAuthController");
const authController = require("./../controllers/authController");
router
  .route("/")
  .get(hostAuthController.hostProtect, hostReviewController.getAllhostReviews)
  .post(hostReviewController.createhostReview);

router
  .route("/:id")
  .get(hostReviewController.gethostReview)
  .put(authController.customerProtect, hostReviewController.updatehostReview)
  .delete(
    authController.customerProtect,
    hostReviewController.deletehostReview
  );

module.exports = router;
