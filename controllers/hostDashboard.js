const jwt = require("jsonwebtoken");
const db = require("./../models");
const getToken = require("../utils/listingId");
const Email = require("../utils/email");
const { Op } = require("sequelize");
const moment = require("moment");
const path = require("path");
const express = require("express");
const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
const testUrl = "http://localhost:8079/api/v1/hosts/accept-invite";
const liveUrl = "https://whatever.lat/api/v1/hosts/accept-invite";
const Host = db.hosts;
const Workshop = db.workshops;
const PackageClass = db.packageClasses;
const ClassSession = db.classSessions;
const Experience = db.experiences;
const Staff = db.staffs;
const Invites = db.invites;
const WorkshopTicket = db.workshopTickets;
const ClassTicket = db.classTickets;
const ExperienceTicket = db.experienceTickets;
const PackageTicket = db.packageTickets;

exports.fetchHostDashboard = async (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, host) => {
    if (err) {
      console.log(err);
      return res.status(403).json({ error: "Forbidden" });
    }

    try {
      const currentHost = host.id;
      const allWorkshops = await Workshop.findAll({
        where: { hostId: currentHost },
      });
      const allPackages = await PackageClass.findAll({
        where: { hostId: currentHost },
      });
      const allClasses = await ClassSession.findAll({
        where: { hostId: currentHost },
      });
      const allExperiences = await Experience.findAll({
        where: { hostId: currentHost },
      });

      const allTimeWorkshopTicketBought = await WorkshopTicket.findAll({
        where: { hostId: currentHost },
      });
      const allTimeClassTicketBought = await ClassTicket.findAll({
        where: { hostId: currentHost },
      });
      const allTimeExperienceTicketBought = await ExperienceTicket.findAll({
        where: { hostId: currentHost },
      });
      const allTimePackageTicketBought = await PackageTicket.findAll({
        where: { hostId: currentHost },
      });

      return res.status(200).json({
        totalCreatedWorkhops: allWorkshops.length,
        totalCreatedPackages: allPackages.length,
        totalCreatedClasses: allClasses.length,
        totalCreatedExperiences: allExperiences.length,
        WorkshopTicketsBoughtOverTime: allTimeWorkshopTicketBought.length,
        classTicketsBoughtOverTime: allTimeClassTicketBought.length,
        packageTicketsBoughtOverTime: allTimePackageTicketBought.length,
        experienceTicketsBoughtOverTime: allTimeExperienceTicketBought.length,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
};

exports.inviteStaff = async (req, res, next) => {
  try {
    const email = req.body.email;
    const firstName = req.body.firstName;

    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Please login" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const hostId = decodedToken.id;

    const host = await Host.findOne({ where: { id: hostId } });
    if (!host) {
      return res.status(404).json({ error: "Host not found" });
    }

    if (!email || !firstName) {
      return res.status(403).json({
        error: "To invite a staff you have to provide their name/email",
      });
    }

    const findInvite = await Invites.findOne({ where: { email, hostId } });
    if (findInvite) {
      return res.status(403).json({ error: "Staff has already been invited" });
    }

    const inviteExpiresAt = moment().add(24, "hours").toDate();
    const invite = await Invites.create({
      email,
      hostId,
      inviteExpiresAt,
    });

    const inviteId = invite.id;
    const url = `${liveUrl}/${inviteId}`;
    const user = {
      email: email,
      firstName: firstName,
    };

    await new Email(
      user,
      url,
      null,
      null,
      null,
      null,
      null,
      null,
      null
    ).inviteStaff();

    return res.status(200).json({ message: "Invitation sent successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAllMyStaff = async (req, res) => {
  try {
    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Please login" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const hostId = decodedToken.id;

    const host = await Host.findOne({ where: { id: hostId } });
    const staff = await Invites.findAll({
      where: { hostId, accepted: true },
    });

    return res
      .status(200)
      .json({ msg: "success", totalStaff: staff.length, staff });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getMyUpcoming = async (req, res) => {
  try {
    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Please login" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const hostId = decodedToken.id;

    const currentTime = new Date();

    const workshops = await Workshop.findAll({
      where: {
        hostId: hostId,
        startDate: {
          [Op.gt]: currentTime,
        },
      },
      order: [["startDate", "ASC"]],
    });

    const classSession = await ClassSession.findAll({
      where: {
        hostId: hostId,
        startDate: {
          [Op.gt]: currentTime,
        },
      },
      order: [["startDate", "ASC"]],
    });

    const experience = await Experience.findAll({
      where: {
        hostId: hostId,
        startDate: {
          [Op.gt]: currentTime,
        },
      },
      order: [["startDate", "ASC"]],
    });

    const package = await PackageClass.findAll({
      where: {
        hostId: hostId,
        startDate: {
          [Op.gt]: currentTime,
        },
      },
      order: [["startDate", "ASC"]],
    });

    return res.status(200).json({
      msg: "success",
      workshops,
      experience,
      package,
      classSession,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
exports.getMyHistory = async (req, res) => {
  try {
    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Please login" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const hostId = decodedToken.id;

    const currentTime = new Date();

    const [workshops, classSession, experience, package] = await Promise.all([
      Workshop.findAll({
        where: { hostId, endDate: { [Op.lt]: currentTime } },
        order: [["endDate", "ASC"]],
      }),
      ClassSession.findAll({
        where: { hostId, endDate: { [Op.lt]: currentTime } },
        order: [["endDate", "ASC"]],
      }),
      Experience.findAll({
        where: { hostId, endDate: { [Op.lt]: currentTime } },
        order: [["endDate", "ASC"]],
      }),
      PackageClass.findAll({
        where: { hostId, endDate: { [Op.lt]: currentTime } },
        order: [["endDate", "ASC"]],
      }),
    ]);

    return res.status(200).json({
      msg: "success",
      workshops,
      experience,
      package,
      classSession,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.acceptInvite = async (req, res, next) => {
  const inviteId = req.params.inviteId;
  const now = new Date();

  const invite = await Invites.findOne({ where: { id: inviteId } });
  try {
    if (!invite) {
      return res.status(404).send("Invite not found");
    }

    if (invite.inviteExpiresAt < now) {
      return res.status(403).send("Invite has expired");
    }

    if (invite.accepted === true) {
      return res.render("already-accepted");
    }

    invite.acceptedAt = now;
    invite.accepted = true;
    await invite.save();

    const host = await Host.findOne({ where: { id: invite.hostId } });
    return res.render("invite-accepted", {
      email: invite.email,
      invitedBy: host.firstName,
      hostEmail: host.email,
      date: now.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};
