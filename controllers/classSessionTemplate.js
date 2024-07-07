const jwt = require("jsonwebtoken");
const db = require("../models");

const ClassSession = db.classSessions;

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

    const providedClassSessionId = req.params.id;

    try {
      if (!providedClassSessionId || isNaN(providedClassSessionId)) {
        return res.status(400).json({ error: "Invalid ClassSessionId" });
      }

      const existingClassSession = await ClassSession.findOne({
        where: {
          id: providedClassSessionId,
          hostId: host.id,
          templateStatus: true,
        },
      });

      if (!existingClassSession) {
        return res.status(404).json({ error: "ClassSession not found" });
      }

      // Create a new ClassSession instance based on the existing one
      const newClassSession = ClassSession.build({
        title: existingClassSession.title,
        description: existingClassSession.description,
        ageGroup: existingClassSession.ageGroup,
        ageMax: existingClassSession.ageMax,
        ageMin: existingClassSession.ageMin,
        duration: existingClassSession.duration,
        capacity: existingClassSession.capacity,
        fullCapacity: existingClassSession.fullCapacity,
        capacityStatus: existingClassSession.capacityStatus,
        price: existingClassSession.price,
        templateStatus: existingClassSession.templateStatus,
        hostId: host.id,

        // what to change
        posterUrl: req.body.posterUrl,
        price: req.body.price,
        startDate: req.body.startDate,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        endDate: req.body.endDate,
      });

      // Set the hostId to the current host's ID
      newClassSession.hostId = host.id;
      await newClassSession.save();

      res.status(200).json({ msg: "Created successfully", newClassSession });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
};
