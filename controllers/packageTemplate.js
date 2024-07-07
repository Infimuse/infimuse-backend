const jwt = require("jsonwebtoken");
const db = require("../models");

const PackageClass = db.packageClasses;

exports.createTemplates = async (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ error: "Please log in or provide a valid token" });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, host) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    const providedPackageId = req.params.id;

    try {
      if (!providedPackageId || isNaN(providedPackageId)) {
        return res.status(400).json({ error: "Invalid workshopId" });
      }

      const existingPackage = await PackageClass.findOne({
        where: {
          id: providedPackageId,
          hostId: host.id,
          templateStatus: true,
        },
      });

      if (!existingPackage) {
        return res.status(404).json({ error: "PackageClass not found" });
      }

      // Create a new PackageClass instance based on the existing one
      const newPackageClass = PackageClass.build({
        title: existingPackage.title,
        description: existingPackage.description,
        ageGroup: existingPackage.ageGroup,
        ageMax: existingPackage.ageMax,
        ageMin: existingPackage.ageMin,
        duration: existingPackage.duration,
        capacity: existingPackage.capacity,
        fullCapacity: existingPackage.fullCapacity,
        capacityStatus: existingPackage.capacityStatus,
        price: existingPackage.price,
        templateStatus: existingPackage.templateStatus,

        // what to change
        posterUrl: req.body.posterUrl,
        price: req.body.price,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
      });

      // Set the hostId to the current host's ID
      newPackageClass.hostId = host.id;
      await newPackageClass.save();

      res.status(200).json({ msg: "Created successfully", newPackageClass });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
};
