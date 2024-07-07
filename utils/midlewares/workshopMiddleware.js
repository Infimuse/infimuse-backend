const db = require("./../../models");
const Host = db.hosts;
const Workshop = db.workshops;
const jwt = require("jsonwebtoken");
const HostPlan = db.hostPlans;

const getWorkshopLimitPlan = (hostPlanId) => {
  switch (hostPlanId) {
    case "FreePlan":
      return 100;
    case "Growth":
      return 100;
    case "Professional":
      return 100;

    default:
      break;
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
    const workshopLimit = getWorkshopLimitPlan(plan.subscription);
    const currentCount = await Workshop.count({ where: { hostId } });

    if (currentCount > workshopLimit) {
      return res.status(403).json({
        Msg: "You have reached your maximum number of listing based on your subscription",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};
