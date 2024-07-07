const db = require("./../../models");
const Host = db.hosts;
const PackageSession = db.packageSessions;
const jwt = require("jsonwebtoken");

module.exports = roleRestrict = async (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const hostId = decodedToken.id;

    const host = await Host.findByPk(hostId);
    if (!host) {
      return res.status(404).json({ error: "Host not found" });
    }

    if (host.role === "INDIVIDUAL") {
      const packageSessionCount = await PackageSession.count({
        where: { hostId },
      });
      if (packageSessionCount >= 5) {
        return res.status(403).json("You have reached the maximum limit");
      }
    }

    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};
