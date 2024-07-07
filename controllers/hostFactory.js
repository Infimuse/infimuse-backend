const jwt = require("jsonwebtoken");
const db = require("../models");
const Workshop = db.workshops;
const PackageClass = db.packageClasses;
const ClassSession = db.classSessions;

exports.getHostWorkshops = async (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];

  if (!token) {
    return Error("User not found");
  }
  jwt.verify(token, process.env.JWT_SECRET, async (err, host) => {
    try {
      const workshops = await Workshop.findAll({
        where: { hostId: host.id },
      });
      res
        .status(200)
        .json({ message: "success", total: workshops.length, workshops });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "internal server error" });
    }
  });
};

exports.getHostPackageClasses = async (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];

  if (!token) {
    return Error("Please login");
  }
  jwt.verify(token, process.env.JWT_SECRET, async (err, host) => {
    try {
      const packages = await PackageClass.findAll({
        where: { hostId: host.id },
      });
      res
        .status(200)
        .json({ message: "success", total: packages.length, packages });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "internal server error" });
    }
  });
};

exports.getHostClassSession = async (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];

  if (!token) {
    return Error("Please login");
  }
  jwt.verify(token, process.env.JWT_SECRET, async (err, host) => {
    try {
      const classes = await ClassSession.findAll({
        where: { hostId: host.id },
      });
      res
        .status(200)
        .json({ message: "success", total: classes.length, classes });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "internal server error" });
    }
  });
};
