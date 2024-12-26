const db = require("./../models");
const factory = require("./factory");
const jwt = require("jsonwebtoken");
const Email = require("../utils/email");
const paystackApi = require("../paystackApi");
const crypto = require("crypto");
const TicketHolder = db.ticketHolders;
const jwtSecret = process.env.JWT_SECRET;
const ClassSession = db.freeExperiences;
const ClassTicket = db.classTickets;
const CancelTicket = db.cancelTickets;
const Customer = db.customers;
const Host = db.hosts;
const axios = require("axios");
const experience = require("../models/experience");
const Venue = db.venues;
const Rating = db.ratings;
const mattermostUrl = process.env.MATTERMOST_URL;
const adminUsername = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;
const team_id = process.env.TEAM_ID;
const chatRoomLink = process.env.CHANNELROOMLINK;

// exports.createClassSession = factory.createDoc(ClassSession);
exports.getWithin = factory.getWithin(ClassSession);
exports.updateClassSession = factory.updateDoc(ClassSession);
exports.getUpcoming = factory.getUpcoming(ClassSession);
exports.getHistory = factory.getHistory(ClassSession);
exports.getEnriching = factory.getAllCategory("enriching");
exports.getLearning = factory.getAllCategory("learning");
exports.getSipping = factory.getAllCategory("sipping");
exports.getKids = factory.getAllCategory("kids");

const getAuthToken = async () => {
  try {
    const response = await axios.post(`${mattermostUrl}/users/login`, {
      login_id: adminUsername,
      password: adminPassword,
    });
    return response.headers.token;
  } catch (error) {
    throw new Error("Failed to authenticate with Mattermost: " + error.message);
  }
};
// ex
exports.createClassSession = async (req, res, next) => {
  const venueId = req.body.venueId;
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "please login" });
  }

  const decodedToken = jwt.verify(token, jwtSecret);
  const hostId = decodedToken.id;

  const host = await Host.findOne({ where: { id: hostId } });
  if (!host) {
    return res.status(404).json({ error: "host not found" });
  }

  if (host.vetted === true || host.legit === true) {
    return res.status(403).json({ error: "you're already verified" });
  }
  try {
    if (!venueId) {
      return res.status(403).json({ error: "Please provide the venueId" });
    }

    const venueCheck = await Venue.findOne({ where: { id: venueId } });
    if (!venueCheck) {
      return res.status(404).json({ error: "No venue with that id found" });
    }
    if (venueCheck.hostId !== hostId) {
      return res
        .status(403)
        .json({ error: "The venue you selected does not belong to you" });
    }

    // Create a new class session
    const doc = await ClassSession.create({
      title: req.body.title,
      description: req.body.description,
      posterUrl: req.body.posterUrl,
      capacity: req.body.capacity,
      fullCapacity: req.body.fullCapacity,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      date: req.body.date,
      price: 0,
      capacityStatus: req.body.capacityStatus,
      ageGroup: req.body.ageGroup,
      ageMin: req.body.ageMin,
      ageMax: req.body.ageMax,
      templateStatus: req.body.templateStatus,
      hostId,
      venueId,
      experienceCategory: req.body.experienceCategory,
    });

    const classId = doc.id;

    const bookExperienceUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/class-sessions/book/${classId}`;

    try {
      const uniqueChannelName = crypto
        .randomBytes(2)
        .toString("hex")
        .toLowerCase();
      const token = await getAuthToken();
      const name = `${uniqueChannelName}-${doc.title}`;
      const createMattermostGroup = await axios.post(
        `${mattermostUrl}/channels`,
        {
          name,
          display_name: doc.title,
          team_id,
          display_name: `${uniqueChannelName}-${doc.title}`,
          header: doc.title,
          type: "O",
        },

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const channelLink = `${chatRoomLink}/${name}`;
      await doc.update({ channelLink });

      return res.status(200).json({
        status: "Document/channel created successfully",
        bookingUrl: bookExperienceUrl,
        chatRoomLink: channelLink,
        doc,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
