const factory = require("./factory");
const db = require("./../models");

const PackageSession = db.packageSessions;
const PackageTicket = db.packageTickets;
const Comment = db.comments;
const Location = db.locations;
const Host = db.hosts;
const PackageClass = db.packageClasses;

// exports.createPackageSession = factory.createDoc(PackageSession);
exports.getAllPackageSessions = factory.getAllDocs(PackageSession);
exports.getWithin = factory.getWithin(PackageSession);
exports.updatePackageSession = factory.updateDoc(PackageSession);
exports.deletePackageSession = factory.deleteDoc(PackageSession);

exports.createPackageSession = async (req, res, next) => {
  try {
    const title = req.body.title;
    const description = req.body.description;
    const startTime = req.body.startTime;
    const endTime = req.body.endTime;
    const date = req.body.date;
    const packageClassId = req.body.packageClassId;
    const hostId = req.body.hostId;

    const existingPackageClass = await PackageClass.findOne({
      where: { id: packageClassId },
    });
    if (!existingPackageClass) {
      return res.status(404).json({ error: "Package Class not found" });
    }

    // extracting the dates
    const packageEndDate = existingPackageClass.endDate;
    const year1 = packageEndDate.getFullYear();
    const month1 = packageEndDate.getMonth();
    const day1 = packageEndDate.getDate();

    // start dates
    const packageStartDate = existingPackageClass.startDate;
    const year3 = packageStartDate.getFullYear();
    const month3 = packageStartDate.getMonth();
    const day3 = packageStartDate.getDate();

    const datestring = new Date(date);
    const year2 = datestring.getFullYear();
    const month2 = datestring.getMonth();
    const day2 = datestring.getDate();

    const newPackageEndDate = new Date(year1, month1, day1);
    const newPackageStartDate = new Date(year3, month3, day3);
    const newDate = new Date(year2, month2, day2);

    if (newDate > newPackageEndDate) {
      return res.status(403).json({
        error:
          "The Package session you are trying to refer to just ended,please check the dates",
      });
    }

    if (newDate < newPackageStartDate) {
      return res.status(403).json({
        error:
          "The Package session you are refering to, the start dates do not match,please check the dates",
      });
    }
    const doc = await PackageSession.create({
      title,
      description,
      startTime,
      endTime,
      date,
      hostId,
      packageClassId,
    });

    return res.status(200).json({ status: "Document created successful", doc });
  } catch (err) {
    console.log(err);
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
