const express = require("express");
const router = express.Router();

const HostTotalReviews = require("../controllers/hostReview");

router
  .route("/")
  .post(HostTotalReviews.createhostReview)
  .get(HostTotalReviews.getAllhostReviews);
router
  .route("/:id")
  .get(HostTotalReviews.gethostReview)
  .put(HostTotalReviews.updatehostReview)
  .delete(HostTotalReviews.deletehostReview);
module.exports = router;
