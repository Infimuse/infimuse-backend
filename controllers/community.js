const db = require("./../models");
const Host = db.hosts;
const Community = db.communities;

exports.createCommunity = async (req, res) => {
  const hostId = req.body.hostId;
  const name = req.body.name;

  const existingHost = await Host.findOne({ where: { id: hostId } });
  if (!existingHost) {
    return res.status(404).json({ error: "Host not found" });
  }
  const hostInCommunity = await Community.findOne({ where: hostId });
  if (hostInCommunity) {
    return res
      .status(403)
      .json({ error: "As a host you can only have one community" });
  }
  const community = await Community.create({
    hostId,
    name,
  });

  return res.status(201).json({ success: "created successfully", community });
};
