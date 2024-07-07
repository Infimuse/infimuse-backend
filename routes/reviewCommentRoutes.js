const express = require("express");
const router = express.Router();

const ReviewCommentController = require("../controllers/reviewCommentController");

router
  .route("/")
  .get(ReviewCommentController.getAllReviewComments)
  .post(ReviewCommentController.createReviewComment);

router
  .route("/:id")
  .put(ReviewCommentController.updateReviewComment)
  .get(ReviewCommentController.getReviewComment)
  .delete(ReviewCommentController.deleteReviewComment);
module.exports = router;
