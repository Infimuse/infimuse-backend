const db = require("./../../models");
const Host = db.hosts;
const HostPlan = db.hostPlans;
const Experience = db.experiences;
const jwt = require("jsonwebtoken");

const getClassLimitForPlan = (hostPlan) => {
  switch (hostPlan) {
    case "freePlan":
      return 50;
    case "growth":
      return 200;
    case "professional":
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
    if (plan.period === "annual") {
      const now = new Date();
      const formattedDate = now.toISOString().split("T")[0];

      if (plan.expiresAt <= now) {
        return res.status(400).json({
          error: "Your plan has expired please update/renew your plan",
        });
      }

      const classLimit = getClassLimitForPlan(plan.subscription);
      const newLimit = classLimit * 12;

      const currentClassCount = await Experience.count({
        where: { hostId, status: "UPCOMING" },
      });

      if (currentClassCount > newLimit) {
        return res.status(403).json({
          Msg: "You have reached your maximum number of experiences based on your subscription,please upgrade to create more venues",
          currentSubscription: plan.subscription,
          totalListedPackages: currentClassCount,
          allowedVenues: `less than ${currentClassCount}`,
        });
      }
    } else if (plan.period === "month") {
      const now = new Date();
      const formattedDate = now.toISOString().split("T")[0];

      if (plan.expiresAt <= now) {
        return res.status(400).json({
          error: "Your plan has expired please update/renew your plan",
        });
      }

      const classLimit = getClassLimitForPlan(plan.subscription);

      const currentClassCount = await Experience.count({
        where: { hostId, status: "UPCOMING" },
      });

      if (currentClassCount > classLimit) {
        return res.status(403).json({
          Msg: "You have reached your maximum number of experiences based on your subscription,please upgrade to create more venues",
          currentSubscription: plan.subscription,
          totalListedPackages: currentClassCount,
          allowedVenues: `less than ${currentClassCount}`,
        });
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};
