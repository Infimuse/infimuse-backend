const db = require("./../../models");
const Host = db.hosts;
const Workshop = db.workshops;
const jwt = require("jsonwebtoken");
const HostPlan = db.hostPlans;

const getWorkshopLimitPlan = (hostPlanId) => {
  switch (hostPlanId) {
    case "freePlan":
      return 100;
    case "growth":
      return 1;
    case "professional":
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
    if (plan.period === "annual") {
      const now = new Date();
      const formattedDate = now.toISOString().split("T")[0];

      if (plan.expiresAt <= now) {
        return res.status(400).json({
          error: "Your plan has expired please update/renew your plan",
        });
      }
      const workshopLimit = getWorkshopLimitPlan(plan.subscription);
      const newLimit = workshopLimit * 12;

      const currentCount = await Workshop.count({
        where: { hostId, status: "UPCOMING" },
      });

      if (currentCount > newLimit) {
        return res.status(403).json({
          Msg: "You have reached your maximum number of Workshops based on your subscription,please upgrade to create more venues",
          currentSubscription: plan.subscription,
          totalListedVenues: currentCount,
          allowedWorkshops: `less than ${currentCount}`,
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
      const workshopLimit = getWorkshopLimitPlan(plan.subscription);
      const currentCount = await Workshop.count({
        where: { hostId, status: "UPCOMING" },
      });

      if (currentCount > workshopLimit) {
        return res.status(403).json({
          Msg: "You have reached your maximum number of Workshops based on your subscription,please upgrade to create more venues",
          currentSubscription: plan.subscription,
          totalListedVenues: currentCount,
          allowedWorkshops: `less than ${currentCount}`,
        });
      }
    }

    next();
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
