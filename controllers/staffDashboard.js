const jwt = require("jsonwebtoken");
const db = require("../models");
const factory = require("./factory");
const bcrypt = require("bcryptjs");
const Email = require("../utils/email");
const Workshop = db.workshops;
const PackageClass = db.packageClasses;
const Experience = db.experiences;
const ClassSession = db.classSessions;
const Staff = db.staffs;
const Host = db.hosts;
const Invites = db.invites;
const AcceptInvite = db.acceptInvites;

// api/v1/staffs/dashboard/:hostId

exports.getAllListingsAssigned = async (req, res) => {
  try {
    const hostId = req.params.hostId;
    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "unauthorised,please login" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const staffId = decodedToken.id;

    const staff = await Staff.findOne({ where: { id: staffId } });
    if (!staff) {
      return res.status(404).json({ error: "staff not found" });
    }

    const host = await Host.findOne({ where: { id: hostId } });
    if (!host) {
      return res.status(404).json({ error: "host not found" });
    }

    // check whether that staff belongs to that host
    const staffCheck = await Invites.findOne({
      where: { hostId, email: staff.email, accepted: true },
    });

    if (!staffCheck) {
      return res
        .status(403)
        .json({ error: "you don't have the rights to work for this host" });
    }

    // if the staff has the rights then get all listings that belong to this host and has been assigned to this staff

    const assignedListings = await AcceptInvite.findAll({
      where: { hostId, staffId },
    });

    const workshopIds = assignedListings.map((assigned) => assigned.workshopId);
    const experienceId = assignedListings.map(
      (assigned) => assigned.experienceId
    );
    const classSessionId = assignedListings.map(
      (assigned) => assigned.classSessionId
    );
    const packageClassId = assignedListings.map(
      (assigned) => assigned.packageClassId
    );

    // Fetch host details
    const workshops = await Workshop.findAll({
      where: { id: workshopIds },
    });

    const packages = await PackageClass.findAll({
      where: { id: packageClassId },
    });
    const classSession = await ClassSession.findAll({
      where: { id: classSessionId },
    });
    const experience = await Experience.findAll({
      where: { id: experienceId },
    });

    return res
      .status(200)
      .json({ msg: "success", workshops, packages, classSession, experience });
  } catch (error) {
    return res.status(500).json({ error: "Internal servere error" });
  }
};

exports.getAllMyHosts = async (req, res) => {
  try {
    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "unauthorised,please login" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const staffId = decodedToken.id;
    const staff = await Staff.findOne({ where: { id: staffId } });
    const allInvites = await Invites.findAll({ where: { email: staff.email } });
    const hostIds = allInvites.map((hosts) => hosts.hostId);

    const hosts = await Host.findAll({ where: { id: hostIds } });
    return res.status(200).json({ msg: hosts });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getOneWorkshop = async (req, res) => {
  try {
    // url api/v1/staffs/workshops/:workshopId
    const workshopId = req.params.workshopId;
    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "unauthorised,please login" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const staffId = decodedToken.id;

    const workshop = await Workshop.findOne({ where: { id: workshopId } });
    if (!workshop) {
      return res.status(404).json({ error: "workshop not found" });
    }

    const hostId = workshop.hostId;

    const staff = await Staff.findOne({ where: { id: staffId } });
    const host = await Host.findOne({ where: { id: hostId } });

    const invited = await AcceptInvite.findOne({
      where: { hostId, staffId, workshopId },
    });

    if (!invited) {
      return res
        .status(403)
        .json({ error: "This listing has not been assigned to you" });
    }
    return res.status(200).json({ msg: workshop });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getOneExperience = async (req, res) => {
  try {
    // url api/v1/staffs/workshops/:workshopId
    const experienceId = req.params.experienceId;
    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "unauthorised,please login" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const staffId = decodedToken.id;

    const experience = await Experience.findOne({
      where: { id: experienceId },
    });
    if (!experience) {
      return res.status(404).json({ error: "experience not found" });
    }

    const hostId = experience.hostId;

    const staff = await Staff.findOne({ where: { id: staffId } });
    const host = await Host.findOne({ where: { id: hostId } });

    const invited = await AcceptInvite.findOne({
      where: { hostId, staffId, experienceId },
    });

    if (!invited) {
      return res
        .status(403)
        .json({ error: "This listing has not been assigned to you" });
    }
    return res.status(200).json({ msg: experience });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getOnePackage = async (req, res) => {
  try {
    // url api/v1/staffs/workshops/:workshopId
    const packageClassId = req.params.packageClassId;
    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "unauthorised,please login" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const staffId = decodedToken.id;

    const packageClass = await PackageClass.findOne({
      where: { id: packageClassId },
    });
    if (!packageClass) {
      return res.status(404).json({ error: "packageClass not found" });
    }

    const hostId = packageClass.hostId;

    const staff = await Staff.findOne({ where: { id: staffId } });
    const host = await Host.findOne({ where: { id: hostId } });

    const invited = await AcceptInvite.findOne({
      where: { hostId, staffId, packageClassId },
    });

    if (!invited) {
      return res
        .status(403)
        .json({ error: "This listing has not been assigned to you" });
    }
    return res.status(200).json({ msg: packageClass });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getOneClassSession = async (req, res) => {
  try {
    // url api/v1/staffs/workshops/:workshopId
    const classSessionId = req.params.classSessionId;
    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "unauthorised,please login" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const staffId = decodedToken.id;

    const classSession = await ClassSession.findOne({
      where: { id: classSessionId },
    });
    if (!classSession) {
      return res.status(404).json({ error: "classSession not found" });
    }

    const hostId = classSession.hostId;

    const staff = await Staff.findOne({ where: { id: staffId } });
    const host = await Host.findOne({ where: { id: hostId } });

    const invited = await AcceptInvite.findOne({
      where: { hostId, staffId, classSessionId },
    });

    if (!invited) {
      return res
        .status(403)
        .json({ error: "This listing has not been assigned to you" });
    }
    return res.status(200).json({ msg: classSession });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
