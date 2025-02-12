const db = require("./../models");
const jwt = require("jsonwebtoken");
const Host = db.hosts;
const Community = db.communities;
const JWT_SECRET = process.env.JWT_SECRET;


exports.createCommunity = async (req, res) => {
  try {
    const name = req.body.name;
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const hostId = decoded.id;
    
    const existingHost = await Host.findOne({ where: { id: hostId } });
    if (!existingHost) {
      return res.status(404).json({ error: "Host not found" });
    }
    
    const hostInCommunity = await Community.findOne({ where: { hostId } });
    if (hostInCommunity) {
      return res
        .status(403)
        .json({ error: "As a host you can only have one community" });
    }
    
    // Create the new community
    const newCommunity = await Community.create({
      name,
      hostId
    });
    
    return res.status(201).json(newCommunity);
    
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};