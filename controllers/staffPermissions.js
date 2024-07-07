const db = require("../models");
const StaffPermission = db.staffPermissions;
const Host = db.hosts;
const Staff = db.staffs;
const Workshop = db.workshops;
const PackageClass = db.packageClasses;
const ClassSession = db.classSessions;
const jwt = require("jsonwebtoken");
const staff = require("../models/staff");

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
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];
  if (!token) {
    return next(Error("Please login"));
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, staff) => {
    if (err) {
      return next(Error("invalid token"));
    }
    // http://localhost/8080/api/v1/staffs/workshops/:workshopId
    const { workshopId } = req.params;
    const newstaff = await Staff.findOne({ where: { id: staff.id } });
    if (!newstaff) {
      return res.status(404).json({ error: " User not found" });
    }
    const staffId = newstaff.id;

    const Permission = await StaffPermission.findAll({
      where: { staffId, workshopId },
    });

    if (Permission.length === 0) {
      return res
        .status(403)
        .json({ msg: "You do not have any permision for that workshop" });
    }

    const existingWorkshop = await Workshop.findOne({
      where: { id: workshopId },
    });
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

    return next(Error("It is not a template"));

    // res.status(200).json({ Msg: "success", workshops });
  });
};

exports.checkStaffPermissionAndCreatePackage = async (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];

  if (!token) {
    return next(Error("Pleae login"));
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, staff) => {
    if (err) {
      return next(Error("invalid token "));
    }
    const newstaff = await Staff.findOne({ where: { id: staff.id } });
    if (!newstaff) {
      return res.status(404).json({ error: "User not found" });
    }
    const staffId = newstaff.id;

    const { packageClassId } = req.params;
    try {
      const permissions = await StaffPermission.findOne({
        where: { staffId, packageClassId },
      });
      if (!permissions) {
        return res
          .status(403)
          .json({ error: "You do not have the permission to that package" });
      }

      const existingPackage = await PackageClass.findOne({
        where: { id: packageClassId },
      });

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

        return res.status(200).json({ msg: "Success" });
      }
      return res
        .status(404)
        .json({ error: "The package class is not a template" });
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });
};

exports.checkStaffPermissionAndCreateClassSession = async (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];

  if (!token) {
    return res.status(403).json({ error: "Please login" });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, staff) => {
    if (err) {
      return res.status(404).json({ error: "invalid token" });
    }

    const staffId = staff.id;
    const { classSessionId } = req.params;

    try {
      const newStaff = await Staff.findOne({ where: { id: staffId } });
      if (!newStaff) {
        return res.status(404).json({ error: "User not found" });
      }

      const newStaffId = newStaff.id;
      const permissions = await StaffPermission.findOne({
        where: { staffId: newStaffId, classSessionId },
      });

      if (!permissions) {
        return res.status(403).json({
          err: "You do not have the rights to access this class Session",
        });
      }

      const existingClassSession = await ClassSession.findOne({
        where: { id: classSessionId },
      });
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
          hostId: existingClassSession.hostId,

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
      }
      return res.status(200).json({ msg: "Success class Sesion created" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
};
