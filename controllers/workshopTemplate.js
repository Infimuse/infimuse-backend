const jwt = require("jsonwebtoken");
const db = require("../models");

const Workshop = db.workshops;

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
      return res.status(500).json({ error: "Internal Server Error" });
    }

    const providedWorkshopId = req.params.id;

    try {
      if (!providedWorkshopId || isNaN(providedWorkshopId)) {
        return res.status(400).json({ error: "Invalid workshopId" });
      }

      const existingWorkshop = await Workshop.findOne({
        where: {
          id: providedWorkshopId,
          hostId: host.id,
          templateStatus: true,
        },
      });

      if (!existingWorkshop) {
        return res.status(404).json({ error: "Workshop not found" });
      }

      // Create a new workshop instance based on the existing one
      const newWorkshop = Workshop.build({
        title: existingWorkshop.title,
        description: existingWorkshop.description,
        ageGroup: existingWorkshop.ageGroup,
        ageMax: existingWorkshop.ageMax,
        ageMin: existingWorkshop.ageMin,
        duration: existingWorkshop.duration,
        capacity: existingWorkshop.capacity,
        fullCapacity: existingWorkshop.fullCapacity,
        capacityStatus: existingWorkshop.capacityStatus,
        price: existingWorkshop.price,
        templateStatus: existingWorkshop.templateStatus,

        // what to change
        posterUrl: req.body.posterUrl,
        price: req.body.price,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
      });

      // Set the hostId to the current host's ID
      newWorkshop.hostId = host.id;
      await newWorkshop.save();

      res.status(200).json({ msg: "Created successfully", newWorkshop });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
};
