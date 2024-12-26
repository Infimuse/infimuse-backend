const db = require("../models");
const StaffPermission = db.staffPermissions;
const Host = db.hosts;
const Staff = db.staffs;
const Workshop = db.workshops;
const PackageClass = db.packageClasses;
const PackageSession = db.packageSessions;
const ClassSession = db.classSessions;
const jwt = require("jsonwebtoken");
const staff = require("../models/staff");
const AcceptInvite = db.acceptInvites;
const WorkshopClass = db.workshopClasses;
const Experience = db.experiences;

// so where the template == true then the staff can create

exports.checkStaffListings = async (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];
  if (!token) {
    return next(Error("Please login"));
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, staff) => {
    if (err) {
      return next(Error("invalid token"));
    }
    const staffId = staff.id;
    const staffPermissions = await StaffPermission.findAll({
      where: { staffId },
    });

    res.status(200).json({ Msg: "success", staffPermissions });
  });
};

exports.checkStaffPermissionAndCreateWorkshop = async (req, res, next) => {
  // http://localhost/8080/api/v1/staffs/workshops/:packageClassId
  try {
    const workshopId = req.params.workshopId;
    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Please login" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const staffId = decodedToken.id;

    const workshop = await Workshop.findOne({ where: { id: workshopId } });
    if (!workshop) {
      return res.status(404).json({ error: "not found" });
    }
    const hostId = workshop.hostId;
    const permission = await AcceptInvite.findOne({
      where: { staffId, workshopId },
    });
    if (!permission) {
      return res
        .status(403)
        .json({ error: "This template has not been assigned to you" });
    }
    const workshopClass = await WorkshopClass.create({
      title: req.body.title,
      description: req.body.description,
      date: req.body.date,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      status: req.body.status,
      attendance: req.body.attendance,
      lastScannedAt: req.body.lastScannedAt,
      workshopId,
      hostId,
    });
    return res.status(201).json({ msg: "success", workshopClass });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.checkStaffPermissionAndCreatePackage = async (req, res, next) => {
  // http://localhost/8080/api/v1/staffs/workshops/:workshopId
  try {
    const packageClassId = req.params.packageClassId;
    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Please login" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const staffId = decodedToken.id;

    const packageClass = await PackageClass.findOne({
      where: { id: packageClassId },
    });
    if (!packageClass) {
      return res.status(404).json({ error: "not found" });
    }
    const hostId = packageClass.hostId;
    const permission = await AcceptInvite.findOne({
      where: { staffId, packageClassId },
    });
    if (!permission) {
      return res
        .status(403)
        .json({ error: "This template has not been assigned to you" });
    }
    const packageSession = await PackageSession.create({
      title: req.body.title,
      description: req.body.description,
      date: req.body.date,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      status: req.body.status,
      attendance: req.body.attendance,
      lastScannedAt: req.body.lastScannedAt,
      packageClassId,
      hostId,
    });
    return res.status(201).json({ msg: "success", packageSession });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.checkStaffPermissionAndCreateClassSession = async (req, res) => {
  try {
    const classSessionId = req.params.classSessionId;
    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Please login" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const staffId = decodedToken.id;

    const classSession = await ClassSession.findOne({
      where: { id: classSessionId },
    });
    if (!classSession) {
      return res.status(404).json({ error: "not found" });
    }
    const hostId = classSession.hostId;
    const permission = await AcceptInvite.findOne({
      where: { staffId, classSessionId },
    });
    if (!permission) {
      return res
        .status(403)
        .json({ error: "This template has not been assigned to you" });
    }
    const classSessions = await ClassSession.create({
      title: req.body.title,
      description: req.body.description,
      date: req.body.date,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      status: req.body.status,
      attendance: req.body.attendance,
      lastScannedAt: req.body.lastScannedAt,
      classCategory: req.body.classCategory,
      templateStatus: false,
      classSessionId,
      hostId,
    });
    return res.status(201).json({ msg: "success", classSessions });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.checkStaffPermissionAndCreateExperience = async (req, res) => {
  try {
    const title = req.body.title;
    const description = req.body.description;
    const posterUrl = req.body.posterUrl;
    const capacity = req.body.capacity;
    const fullCapacity = req.body.fullCapacity;
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    const startTime = req.body.startTime;
    const endTime = req.body.endTime;
    const date = req.body.date;
    const price = req.body.price;
    const capacityStatus = req.body.capacityStatus;
    const ageGroup = req.body.ageGroup;
    const ageMin = req.body.ageMin;
    const ageMax = req.body.ageMax;
    const templateStatus = req.body.templateStatus;
    const venueId = req.body.venueId;
    const experienceCategory = req.body.experienceCategory;
    const experienceId = req.params.experienceId;
    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Please login" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const staffId = decodedToken.id;

    const experience = await Experience.findOne({
      where: { id: experienceId },
    });
    if (!experience) {
      return res.status(404).json({ error: "not found" });
    }
    const hostId = experience.hostId;
    const permission = await AcceptInvite.findOne({
      where: { staffId, experienceId },
    });
    if (!permission) {
      return res
        .status(403)
        .json({ error: "This template has not been assigned to you" });
    }
    const experiences = await Experience.create({
      title: title,
      description: description,
      posterUrl: posterUrl,
      capacity: capacity,
      fullCapacity: fullCapacity,
      startDate: startDate,
      endDate: endDate,
      startTime: startTime,
      endTime: endTime,
      date: date,
      price: price,
      capacityStatus: capacityStatus,
      ageGroup: ageGroup,
      ageMin: ageMin,
      ageMax: ageMax,
      templateStatus: templateStatus,
      hostId,
      venueId,
      experienceCategory,
    });
    return res.status(201).json({ msg: "success", experiences });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
