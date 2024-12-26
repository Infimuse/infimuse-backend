const factory = require("./factory");
const db = require("./../models");
const Availability = db.availabilities;

const PackageSession = db.packageSessions;
const PackageTicket = db.packageTickets;
const Comment = db.comments;
const Location = db.locations;
const Host = db.hosts;
const PackageClass = db.packageClasses;
const jwt = require("jsonwebtoken");
const secretKey = process.env.JWT_SECRET;

exports.getAllPackageSessions = factory.getAllDocs(PackageSession);
exports.getWithin = factory.getWithin(PackageSession);
exports.updatePackageSession = factory.updateDoc(PackageSession);
exports.deletePackageSession = factory.deleteDoc(PackageSession);

const createAvailabilitySlots = async (
  packageSessionId,
  startDate,
  endDate,
  hostId
) => {
  const timeSlots = ["7Am-9Am", "10Am-12Pm", "1:00Pm-2Pm", "3Pm-5Pm"];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    for (const slot of timeSlots) {
      await Availability.create({
        date: currentDate,
        slot,
        isBooked: false,
        packageSessionId,
        hostId,
      });
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
};

exports.createPackageSession = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Token missing" });
  }

  const decodedToken = jwt.verify(token, secretKey);
  const hostId = decodedToken.id;

  try {
    const {
      title,
      description,
      startDate,
      endDate,
      packageClassId,
      sessionVenueId,
      date,
    } = req.body;

    const existingPackageClass = await PackageClass.findOne({
      where: { id: packageClassId },
    });
    if (!existingPackageClass) {
      return res.status(404).json({ error: "Package Class not found" });
    }

    const packageEndDate = existingPackageClass.endDate;
    const packageStartDate = existingPackageClass.startDate;

    const sessionStartDate = new Date(startDate);
    const sessionEndDate = new Date(endDate);

    if (
      sessionStartDate < packageStartDate ||
      sessionEndDate > packageEndDate
    ) {
      return res.status(403).json({
        error:
          "The PackageSession dates must be within the PackageClass date range.",
      });
    }

    const packageSession = await PackageSession.create({
      title,
      description,
      startDate,
      endDate,
      startDate: sessionStartDate,
      endDate: sessionEndDate,
      hostId,
      date,
      packageClassId,
      sessionVenueId,
    });

    await createAvailabilitySlots(
      packageSession.id,
      sessionStartDate,
      sessionEndDate,
      packageSession.hostId
    );

    return res
      .status(200)
      .json({ status: "Document created successfully", packageSession });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getOnePackageSession = async (req, res) => {
  try {
    const packageSessionId = req.params.id;
    const doc = await PackageSession.findByPk(packageSessionId, {
      include: [
        {
          model: PackageTicket,

          as: "packageTicket",
          attributes: ["ticketId"],
        },

        {
          model: Host,
          as: "host",
          attributes: ["bio", "hostTitle", "qualifications"],
        },
        {
          model: Comment,
          as: "comment",
          attributes: ["comment"],
        },
      ],
    });

    if (!doc) {
      return res
        .status(404)
        .render("error404", { error: "Document not found" });
    }

    res.status(200).json({ result: "Success", Data: doc });
  } catch (error) {
    console.log(error);
    res.status(500).json({ Error: error });
  }
};

exports.packageSessionComments = async (req, res) => {
  try {
    const packageSessionId = req.params.packageSessionId;

    const packageSession = await PackageSession.findOne({
      where: { id: packageSessionId },
    });
    if (!packageSession) {
      throw new Error("there is no workshop with that id");
    }

    const comments = await Comment.create({
      comment: req.body.comment,
      packageSessionId: req.body.packageSessionId,
    });

    res.status(201).json({ msg: "Comment created", comments });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};
