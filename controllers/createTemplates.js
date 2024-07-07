const jwt = require("jsonwebtoken");
const db = require("../models");
const factory = require("./factory");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const Email = require("../utils/email");
const Staff = db.staffs;
const compare = require("secure-compare");
const Workshop = db.workshops;
const PackageClass = db.packageClasses;
const ClassSession = db.classSessions;
const Host = db.hosts;

exports.CreateWorkshopTemplate = async (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];
  if (!token) {
    return next(Error("Please login"));
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, host) => {
    if (err) {
      return next(Error("invalid token"));
    }
    // http://localhost/8080/api/v1/staffs/workshops/:workshopId
    const { workshopId } = req.params;
    const newhost = await Host.findOne({ where: { id: host.id } });
    if (!newhost) {
      return res.status(404).json({ error: " User not found" });
    }
    const hostId = newhost.id;
    const existingWorkshop = await Workshop.findOne({
      where: { id: workshopId },
    });

    if (!existingWorkshop) {
      return res.status(400).json({ Error: "Workshop not found" });
    }
    if (existingWorkshop.templateStatus) {
      const newWorkshop = Workshop.build({
        title: existingWorkshop.title,
        description: existingWorkshop.description,
        ageGroup: existingWorkshop.ageGroup,
        ageMax: existingWorkshop.ageMax,
        ageMin: existingWorkshop.ageMin,
        duration: existingWorkshop.duration,
        capacity: existingWorkshop.capacity,
        fullCapacity: existingWorkshop.fullCapacity,
        capacityStatus: existingWorkshop.capacityStatus,
        price: existingWorkshop.price,
        templateStatus: existingWorkshop.templateStatus,
        hostId: existingWorkshop.hostId,

        // what to change
        posterUrl: req.body.posterUrl,
        price: req.body.price,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
      });

      await newWorkshop.save();
      res.status(200).json({ msg: "success", newWorkshop });
    }

    // res.status(200).json({ Msg: "success", workshops });
  });
};

exports.createPackage = async (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];

  if (!token) {
    return next(Error("Pleae login"));
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, host) => {
    if (err) {
      return next(Error("invalid token "));
    }
    const newHost = await Host.findOne({ where: { id: host.id } });
    if (!newHost) {
      return res.status(404).json({ error: "User not found" });
    }
    const hostId = newHost.id;

    const { packageClassId } = req.params;
    try {
      const existingPackage = await PackageClass.findOne({
        where: { id: packageClassId },
      });

      if (!existingPackage) {
        return res.status(400).json({ Error: "Package not found" });
      }
      if (existingPackage.templateStatus === true) {
        const newPackageClass = PackageClass.build({
          title: existingPackage.title,
          description: existingPackage.description,
          ageGroup: existingPackage.ageGroup,
          ageMax: existingPackage.ageMax,
          ageMin: existingPackage.ageMin,
          duration: existingPackage.duration,
          capacity: existingPackage.capacity,
          fullCapacity: existingPackage.fullCapacity,
          capacityStatus: existingPackage.capacityStatus,
          price: existingPackage.price,
          templateStatus: existingPackage.templateStatus,
          hostId: existingPackage.hostId,

          // what to change
          posterUrl: req.body.posterUrl,
          price: req.body.price,
          startDate: req.body.startDate,
          endDate: req.body.endDate,
        });
        await newPackageClass.save();
        console.log(req.body);

        return res.status(200).json({ msg: newPackageClass });
      }
      return res
        .status(404)
        .json({ error: "The package class is not a template" });
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });
};

exports.createClassSession = async (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];

  if (!token) {
    return res.status(403).json({ error: "Please login" });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, host) => {
    if (err) {
      return res.status(404).json({ error: "invalid token" });
    }

    const hostId = host.id;
    const { classSessionId } = req.params;

    try {
      const newHost = await Host.findOne({ where: { id: hostId } });
      if (!newHost) {
        return res.status(404).json({ error: "User not found" });
      }

      const newHostId = newHost.id;
      //   const permissions = await StaffPermission.findOne({
      //     where: { staffId: newHostId, classSessionId },
      //   });

      //   if (!permissions) {
      //     return res.status(403).json({
      //       err: "You do not have the rights to access this class Session",
      //     });
      //   }

      const existingClassSession = await ClassSession.findOne({
        where: { id: classSessionId },
      });
      if (!existingClassSession) {
        return res.json({ err: "ClassSession not found" });
      }
      if (existingClassSession.templateStatus === true) {
        const newClassSession = ClassSession.build({
          title: existingClassSession.title,
          description: existingClassSession.description,
          ageGroup: existingClassSession.ageGroup,
          ageMax: existingClassSession.ageMax,
          ageMin: existingClassSession.ageMin,
          duration: existingClassSession.duration,
          capacity: existingClassSession.capacity,
          fullCapacity: existingClassSession.fullCapacity,
          capacityStatus: existingClassSession.capacityStatus,
          price: existingClassSession.price,
          templateStatus: existingClassSession.templateStatus,
          hostId,

          // what to change
          posterUrl: req.body.posterUrl,
          price: req.body.price,
          date: req.body.date,
          startDate: req.body.startDate,
          startTime: req.body.startTime,
          endTime: req.body.endTime,
          endDate: req.body.endDate,
        });

        await newClassSession.save();
        return res.status(200).json({ msg: newClassSession });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
};
