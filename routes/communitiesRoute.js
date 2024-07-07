const express = require("express");
const router = express.Router();
const community = require("./../controllers/community");
const postController = require("./../controllers/post");
router.post("/", community.createCommunity);
router.route("/me").get(postController.getMyCommunities);
router.post("/:communityId/posts", postController.createPosts);
router.get("/:communityId/posts", postController.viewAllPostsInCommunity);
router.delete("/:communityId/posts/:postId", postController.customerDeletePost);
router.delete(
  "/:communityId/host-delete/posts/:postId",
  postController.hostDeletePost
);
router.route("/").get(postController.getAllCommunities);
module.exports = router;
