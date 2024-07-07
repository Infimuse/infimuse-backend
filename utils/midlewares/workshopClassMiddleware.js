const db = require("./../../models");
const HostPaymentPlanTrasaction = db.hostPaymentPlanTransactions;
const Host = db.hosts;
const WorkshopClass = db.workshopClasses;
const jwt = require("jsonwebtoken");

const getworkshopClassLimitPlan = (hostPlanId) => {
  switch (hostPlanId) {
    case 1:
      return 10;
    case 2:
      return 10;
    case 3:
      return 3;

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

    const paymentTransaction = await HostPaymentPlanTrasaction.findOne({
      where: { hostId },
    });

    const workshopClassLimit = getworkshopClassLimitPlan(
      paymentTransaction.hostPlanId
    );

    const currentWorkshopClassCount = await WorkshopClass.count({
      where: { hostId },
    });
    if (currentWorkshopClassCount >= workshopClassLimit) {
      return res
        .status(403)
        .json({ error: "Your subscription limit has been reached" });
    }

    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};
