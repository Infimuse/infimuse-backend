const db = require("../../models");
const FreeClass = db.freeClassSessions;
const FreeWorkshop = db.freeworkshops;
const FreeExperience = db.freeExperiences;
const FreePackage = db.freePackageClasses;
const jwt = require("jsonwebtoken");

exports.checkListedFreeSessions = async (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const hostId = decodedToken.id;
    const totalFreeClasses = await FreeClass.findAll({
      where: {
        hostId,
      },
    });

    const totalFreeExperiences = await FreeExperience.findAll({
      where: {
        hostId,
      },
    });

    const totalFreeWorkshops = await FreeWorkshop.findAll({
      where: {
        hostId,
      },
    });

    const totalFreePackages = await FreePackage.findAll({
      where: {
        hostId,
      },
    });

    const totalFreeListings =
      totalFreeClasses.length +
      totalFreeExperiences.length +
      totalFreePackages.length +
      totalFreeWorkshops.length;

    if (totalFreeListings >= 5) {
      return res.status(403).json({
        error: "You've reached maximum free listings wait to be vetted",
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};
