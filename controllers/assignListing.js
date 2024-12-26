const db = require("../models");
const jwt = require("jsonwebtoken");
const Email = require("../utils/email");
const Host = db.hosts;
const Invites = db.invites;
const Staff = db.staffs;
const Workshop = db.workshops;
const ClassSession = db.classSessions;
const Experience = db.experiences;
const PackageClass = db.packageClasses;
const AcceptInvite = db.acceptInvites;

exports.inviteStaffToWorkshop = async (req, res) => {
  try {
    const workshopId = req.body.workshopId;
    const staffEmail = req.body.staffEmail;

    if (!workshopId || !staffEmail) {
      return res
        .status(403)
        .json({ error: "please provide the staffId/listingId" });
    }

    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorised please login" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const hostId = decodedToken.id;
    const host = await Host.findOne({ where: { id: hostId } });
    if (!host) {
      return res.status(404).json({ error: "Host not found" });
    }

    const workshop = await Workshop.findOne({ where: { id: workshopId } });
    if (!workshop) {
      return res.status(404).json({ error: "workshop not found" });
    }
    if (workshop.templateStatus !== true) {
      return res.status(403).json({
        error: "this is not a template you only need to assign a template ",
      });
    }

    if (workshop.hostId !== hostId) {
      return res
        .status(403)
        .json({ error: "the listing does not belong to you, hostId mismatch" });
    }
    const invite = await Invites.findOne({
      where: { email: staffEmail, hostId },
    });
    if (!invite) {
      return res.status(404).json({
        error:
          "The staff you are trying to assign the listing to, does not belong to you,check the email",
      });
    }
    if (invite.accepted == false) {
      return res
        .status(403)
        .json({ error: "The staff has not yet accepted the invite" });
    }
    const staff = await Staff.findOne({ where: { email: invite.email } });
    if (!staff) {
      return res.status(404).json({
        error:
          "The staff has not yet created an infimuse account, they need to create a staff account using the email that the invite was sent to",
      });
    }
    const staffId = staff.id;
    const existingAssignment = await AcceptInvite.findOne({
      where: { workshopId },
    });
    if (existingAssignment) {
      return res.status(403).json({
        error: "This workshop is already assigned to another staff member",
      });
    }
    const updateAcceptInvite = await AcceptInvite.create({
      staffId,
      hostId,
      workshopId,
    });
    const url = host.firstName;
    const title = workshop.title;
    const listingDescription = workshop.description;

    new Email(staff, url, title, listingDescription).assignedListing();
    return res
      .status(200)
      .json({ msg: `success listing assigned to  ${staff.firstName}` });
    //
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.inviteStaffToClassSession = async (req, res) => {
  try {
    const classSessionId = req.body.classSessionId;
    const staffEmail = req.body.staffEmail;

    if (!classSessionId || !staffEmail) {
      return res
        .status(403)
        .json({ error: "please provide the staffId/listingId" });
    }

    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorised please login" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const hostId = decodedToken.id;
    const host = await Host.findOne({ where: { id: hostId } });
    if (!host) {
      return res.status(404).json({ error: "Host not found" });
    }

    const classSession = await ClassSession.findOne({
      where: { id: classSessionId },
    });
    if (!classSession) {
      return res.status(404).json({ error: "classSession not found" });
    }
    if (classSession.templateStatus !== true) {
      return res.status(403).json({
        error: "this is not a template you only need to assign a template ",
      });
    }

    if (classSession.hostId !== hostId) {
      return res
        .status(403)
        .json({ error: "the listing does not belong to you, hostId mismatch" });
    }
    const invite = await Invites.findOne({
      where: { email: staffEmail, hostId },
    });
    if (!invite) {
      return res.status(404).json({
        error:
          "The staff you are trying to assign the listing to, does not belong to you,check the email",
      });
    }
    if (invite.accepted == false) {
      return res
        .status(403)
        .json({ error: "The staff has not yet accepted the invite" });
    }
    const staff = await Staff.findOne({ where: { email: invite.email } });
    if (!staff) {
      return res.status(404).json({
        error:
          "The staff has not yet created an infimuse account, they need to create a staff account using the email that the invite was sent to",
      });
    }
    const staffId = staff.id;
    const existingAssignment = await AcceptInvite.findOne({
      where: { classSessionId },
    });
    if (existingAssignment) {
      return res.status(403).json({
        error: "This classSession is already assigned to another staff member",
      });
    }
    const updateAcceptInvite = await AcceptInvite.create({
      staffId,
      hostId,
      classSessionId,
    });
    const url = host.firstName;
    const title = classSession.title;
    const listingDescription = classSession.description;

    new Email(staff, url, title, listingDescription).assignedListing();
    return res
      .status(200)
      .json({ msg: `success listing assigned to  ${staff.firstName}` });
    //
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.inviteStaffToExperience = async (req, res) => {
  try {
    const experienceId = req.body.experienceId;
    const staffEmail = req.body.staffEmail;

    if (!experienceId || !staffEmail) {
      return res
        .status(403)
        .json({ error: "please provide the staffId/listingId" });
    }

    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorised please login" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const hostId = decodedToken.id;
    const host = await Host.findOne({ where: { id: hostId } });
    if (!host) {
      return res.status(404).json({ error: "Host not found" });
    }

    const experience = await Experience.findOne({
      where: { id: experienceId },
    });
    if (!experience) {
      return res.status(404).json({ error: "experience not found" });
    }
    if (experience.templateStatus !== true) {
      return res.status(403).json({
        error: "this is not a template you only need to assign a template ",
      });
    }

    if (experience.hostId !== hostId) {
      return res
        .status(403)
        .json({ error: "the listing does not belong to you, hostId mismatch" });
    }
    const invite = await Invites.findOne({
      where: { email: staffEmail, hostId },
    });
    if (!invite) {
      return res.status(404).json({
        error:
          "The staff you are trying to assign the listing to, does not belong to you,check the email",
      });
    }
    if (invite.accepted == false) {
      return res
        .status(403)
        .json({ error: "The staff has not yet accepted the invite" });
    }
    const staff = await Staff.findOne({ where: { email: invite.email } });
    if (!staff) {
      return res.status(404).json({
        error:
          "The staff has not yet created an infimuse account, they need to create a staff account using the email that the invite was sent to",
      });
    }
    const staffId = staff.id;
    const existingAssignment = await AcceptInvite.findOne({
      where: { experienceId },
    });
    if (existingAssignment) {
      return res.status(403).json({
        error: "This experience is already assigned to another staff member",
      });
    }
    const updateAcceptInvite = await AcceptInvite.create({
      staffId,
      hostId,
      experienceId,
    });
    const url = host.firstName;
    const title = experience.title;
    const listingDescription = experience.description;

    new Email(staff, url, title, listingDescription).assignedListing();
    return res
      .status(200)
      .json({ msg: `success listing assigned to  ${staff.firstName}` });
    //
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.inviteStaffToPackages = async (req, res) => {
  try {
    const packageClassId = req.body.packageClassId;
    const staffEmail = req.body.staffEmail;

    if (!packageClassId || !staffEmail) {
      return res
        .status(403)
        .json({ error: "please provide the staffId/listingId" });
    }

    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorised please login" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const hostId = decodedToken.id;
    const host = await Host.findOne({ where: { id: hostId } });
    if (!host) {
      return res.status(404).json({ error: "Host not found" });
    }

    const packageClass = await PackageClass.findOne({
      where: { id: packageClassId },
    });
    if (!packageClass) {
      return res.status(404).json({ error: "packageClass not found" });
    }
    if (packageClass.templateStatus !== true) {
      return res.status(403).json({
        error: "this is not a template you only need to assign a template ",
      });
    }

    if (packageClass.hostId !== hostId) {
      return res
        .status(403)
        .json({ error: "the listing does not belong to you, hostId mismatch" });
    }
    const invite = await Invites.findOne({
      where: { email: staffEmail, hostId },
    });
    if (!invite) {
      return res.status(404).json({
        error:
          "The staff you are trying to assign the listing to, does not belong to you,check the email",
      });
    }
    if (invite.accepted == false) {
      return res
        .status(403)
        .json({ error: "The staff has not yet accepted the invite" });
    }
    const staff = await Staff.findOne({ where: { email: invite.email } });
    if (!staff) {
      return res.status(404).json({
        error:
          "The staff has not yet created an infimuse account, they need to create a staff account using the email that the invite was sent to",
      });
    }
    const staffId = staff.id;
    const existingAssignment = await AcceptInvite.findOne({
      where: { packageClassId },
    });
    if (existingAssignment) {
      return res.status(403).json({
        error: "This packageClass is already assigned to another staff member",
      });
    }
    const updateAcceptInvite = await AcceptInvite.create({
      staffId,
      hostId,
      packageClassId,
    });
    const url = host.firstName;
    const title = packageClass.title;
    const listingDescription = packageClass.description;

    new Email(staff, url, title, listingDescription).assignedListing();
    return res
      .status(200)
      .json({ msg: `success listing assigned to  ${staff.firstName}` });
    //
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
