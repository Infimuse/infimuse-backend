const jwt = require("jsonwebtoken");
const db = require("./../models");
const Host = db.hosts;
const Workshop = db.workshops;
const PackageClass = db.packageClasses;
const ClassSession = db.classSessions;
const Staff = db.staffs;
const getToken = require("../utils/listingId");
const Email = require("../utils/email");
exports.fetchHostDashboard = async (req, res, next) => {
  // get the id from jwt
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, host) => {
    if (err) {
      console.log(err);
      return res.status(403).json({ error: "Forbidden" });
    }

    //fetch the listings based on the id
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

      res.status(200).json({
        totalWorkhops: allWorkshops.length,
        totalPackages: allPackages.length,
        totalClasses: allClasses.length,
      });
    } catch (error) {}
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
    const url = host.identifier;
    if (!host) {
      return res.status(404).json({ error: "Host not found" });
    }

    if (!email || !firstName) {
      return res.status(403).json({
        error: "To invite a staff you have to provide their name/email",
      });
    }

    const user = {
      email: email,
      firstName: firstName,
    };

    new Email(
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

    res.status(200).json({ message: "Invitation sent successfully" });
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
    const staff = await Staff.findAll({
      where: { hostIdentifier: host.identifier },
    });

    return res
      .status(200)
      .json({ msg: "success", totalStaff: staff.length, staff });
  } catch (error) {
    console.log(error);
  }
};
