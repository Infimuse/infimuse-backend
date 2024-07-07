const db = require("./../../models");
const Host = db.hosts;
const HostPlan = db.hostPlans;
const ClassSession = db.classSessions;
const jwt = require("jsonwebtoken");

const getClassLimitForPlan = (hostPlan) => {
  switch (hostPlan) {
    case "FreePlan":
      return 50;
    case "Growth":
      return 200;
    case "Professional":
      return 2000;

    default:
      return 0;
  }
};

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

    const plan = await HostPlan.findOne({
      where: { hostId },
    });
    if (!plan) {
      return res.status(404).json({ msg: "Please subscribe to a plan" });
    }

    const classLimit = getClassLimitForPlan(plan.subscription);

    const currentClassCount = await ClassSession.count({ where: { hostId } });

    if (currentClassCount > classLimit) {
      return res.status(403).json({
        Msg: "You have reached your maximum number of listing based on your subscription",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};
