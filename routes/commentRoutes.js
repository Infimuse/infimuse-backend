const express = require("express");
const router = express.Router();
const commentController = require("./../controllers/commentController");
const authController = require("./../controllers/authController");

router
  .route("/")
  .get(commentController.getAllComments)
  .post(authController.customerProtect, commentController.createComment);

router
  .route("/:id")
  .get(commentController.getComment)
  .put(authController.customerProtect, commentController.updateComment)
  .delete(authController.customerProtect, commentController.deleteComment);

module.exports = router;
