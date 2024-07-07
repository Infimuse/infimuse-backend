const factory = require("./factory");
const db = require("./../models");
const jwt = require("jsonwebtoken");
const Host = db.hosts;
const Comment = db.comments;
const Workshop = db.workshops;

const WorkshopClass = db.workshopClasses;

// exports.createWorkshopClass = factory.createDoc(WorkshopClass);
exports.getAllWorkshopClass = factory.getAllDocs(WorkshopClass);
exports.getWithin = factory.getWithin(WorkshopClass);
exports.updateWorkshopClass = factory.updateDoc(WorkshopClass);
exports.deleteWorkshopClass = factory.deleteDoc(WorkshopClass);

exports.createWorkshopClass = async (req, res, next) => {
  try {
    const title = req.body.title;
    const description = req.body.description;
    const startTime = req.body.startTime;
    const endTime = req.body.endTime;
    const date = req.body.date;
    const workshopId = req.body.workshopId;
    const hostId = req.body.hostId;

    const existingWorkshop = await Workshop.findOne({
      where: { id: workshopId },
    });
    if (!existingWorkshop) {
      return res.status(404).json({ error: "Workshop not found" });
    }

    // extracting the dates
    const workshopEndDate = existingWorkshop.endDate;
    const year1 = workshopEndDate.getFullYear();
    const month1 = workshopEndDate.getMonth();
    const day1 = workshopEndDate.getDate();

    // start dates
    const workshopStartDate = existingWorkshop.startDate;
    const year3 = workshopStartDate.getFullYear();
    const month3 = workshopStartDate.getMonth();
    const day3 = workshopStartDate.getDate();

    const datestring = new Date(date);
    const year2 = datestring.getFullYear();
    const month2 = datestring.getMonth();
    const day2 = datestring.getDate();

    const newWorkshopEndDate = new Date(year1, month1, day1);
    const newWorkshopStartDate = new Date(year3, month3, day3);
    const newDate = new Date(year2, month2, day2);

    if (newDate > newWorkshopEndDate) {
      return res.status(403).json({
        error:
          "The workshop you are trying to refer to just ended,please check the dates",
      });
    }

    if (newDate < newWorkshopStartDate) {
      return res.status(403).json({
        error:
          "The Package session you are refering to, the start dates do not match,please check the dates",
      });
    }
    const doc = await WorkshopClass.create({
      title,
      description,
      startTime,
      endTime,
      date,
      hostId,
      workshopId,
    });

    return res.status(200).json({ status: "Document created successful", doc });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getOneWorkshopClass = async (req, res, next) => {
  try {
    const doc = await WorkshopClass.findByPk(req.params.id, {
      include: [
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
    return res.status(200).json({ result: "Success", Data: doc });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ Error: error });
  }
};

exports.workshopClassComents = async (req, res) => {
  try {
    const workshopClassId = req.params.workshopClassId;

    const workshopClass = await WorkshopClass.findOne({
      where: { id: workshopClassId },
    });
    if (!workshopClass) {
      throw new Error("there is no workshop with that id");
    }

    const comments = await Comment.create({
      comment: req.body.comment,
      workshopClassId: req.body.workshopClassId,
    });

    res.status(201).json({ msg: "Comment created", comments });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};
