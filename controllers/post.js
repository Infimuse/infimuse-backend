const db = require("./../models");
const factory = require("./../controllers/factory");
const Post = db.posts;
const CommunityMember = db.communityMemberships;
const Community = db.communities;
const Host = db.hosts;

exports.getAllCommunities = factory.getAllDocs(Community);

exports.getMyCommunities = async (req, res) => {
  const customerId = req.body.customerId;
  const myCommunities = await CommunityMember.findAll({
    where: { customerId },
  });
  return res.status(200).json({ msg: "success", myCommunities });
};
exports.createPosts = async (req, res) => {
  try {
    const communityId = req.params.communityId;
    const customerId = req.body.customerId;
    const video = req.body.video;
    const image = req.body.image;
    const caption = req.body.caption;
    const likes = req.body.likes;

    const checkCommunity = await Community.findOne({
      where: { id: communityId },
    });

    if (!checkCommunity) {
      return res
        .status(404)
        .json({ error: "There is no community with that id" });
    }

    const postRights = await CommunityMember.findOne({
      where: { customerId, communityId },
    });
    if (!postRights) {
      return res.status(403).json({ error: "You can only view posts " });
    }

    const post = await Post.create({
      image,
      video,
      caption,
      likes,
      communityId,
      customerId,
    });

    return res.status(201).json({ msg: "post created successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

exports.customerDeletePost = async (req, res) => {
  try {
    // api/v1/communities/:communityId/posts/:postId
    const customerId = req.body.customerId;
    const communityId = req.params.communityId;
    const postId = req.params.postId;

    const community = await Community.findOne({ where: { id: communityId } });
    if (!community) {
      return res.status(404).json({ error: "community not found" });
    }
    const post = await Post.findOne({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.customerId !== customerId) {
      return res.status(403).json({
        error: "you cannot delete a post that does not belong to you",
      });
    }

    await Post.destroy({ where: { id: postId } });
    return res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.hostDeletePost = async (req, res) => {
  const hostId = req.body.hostId;
  try {
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.viewAllPostsInCommunity = async (req, res) => {
  try {
    const communityId = req.params.communityId;

    const community = await Community.findOne({ where: { id: communityId } });
    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    const posts = await Post.findAll({ where: { communityId: communityId } });
    const totalPosts = posts.length;
    return res
      .status(200)
      .json({ msg: "success", totalPosts: totalPosts, posts });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.hostDeletePost = async (req, res) => {
  try {
    // /:communityId/posts/:postId
    const hostId = req.body.hostId;
    const communityId = req.params.communityId;
    const postId = req.params.postId;

    const community = await Community.findOne({ where: { id: communityId } });
    if (!community) {
      return res.status(404).json({ error: "community not found" });
    }

    if (community.hostId !== hostId) {
      return res.status(403).json({
        error: "You cannot delete posts of a community you're not a host",
      });
    }
    const post = await Post.findOne({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({ error: "post not found" });
    }
    await post.destroy();

    return res.status(200).json({ error: "post deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
