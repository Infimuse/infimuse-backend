const jwt = require("jsonwebtoken");
const db = require("../models");
const AcceptInvite = db.acceptInvites;
const Workshop = db.workshops;
const PackageClass = db.packageClasses;
const Staff = db.staffs;
const ClassSession = db.classSessions;
const StaffPermission = db.staffPermissions;
const crypto = require("crypto");

exports.acceptWorkshop = async (req, res, next) => {
  const { token } = req.body;
  const tokenId =
    req.headers.authorization && req.headers.authorization.split(" ")[1];
  if (!tokenId) {
    return next(Error("PLease login"));
  }
  jwt.verify(tokenId, process.env.JWT_SECRET, async (err, staff) => {
    if (err) {
      return next(Error("Invalid error"));
    }

    const staffId = staff.id;
    const newStaff = await Staff.findOne({ where: { id: staffId } });

    if (!token) {
      return next(Error("Please provide the token sent to your email"));
    }
    const workshop = await Workshop.findOne({ where: { token } });
    if (!workshop) {
      return next(Error("Invalid Token no invite with that code"));
    }

    const acceptInvite = await AcceptInvite.create({
      workshopId: workshop.id,
      staffId: newStaff.id,
      hostId: req.body.hostId,
    });
    await acceptInvite.update({ acceptedInvite: true, declineInvite: false });
    const newtoken = crypto.randomBytes(5).toString("hex").toUpperCase();
    await workshop.update({ token: newtoken });
    if (acceptInvite) {
      await StaffPermission.create({
        staffId: newStaff.id,
        workshopId: workshop.id,
        hostId: acceptInvite.hostId,
        canUpdate: true,
        canCreate: true,
        canDelete: true,
      });
    }

    res.status(200).json({ msg: "accepted invite" });
  });
};

exports.acceptPackage = async (req, res, next) => {
  const { token } = req.body;
  const tokenId =
    req.headers.authorization && req.headers.authorization.split(" ")[1];
  if (!tokenId) {
    return next(Error("PLease login"));
  }
  jwt.verify(tokenId, process.env.JWT_SECRET, async (err, staff) => {
    if (err) {
      return next(Error("Invalid error"));
    }

    const staffId = staff.id;
    const newStaff = await Staff.findOne({ where: { id: staffId } });

    if (!token) {
      return next(Error("Please provide the token sent to your email"));
    }
    const packageClass = await PackageClass.findOne({ where: { token } });
    if (!packageClass) {
      return next(Error("Invalid Token no invite with that code"));
    }

    const acceptInvite = await AcceptInvite.create({
      packageClassId: packageClass.id,
      staffId: newStaff.id,
      hostId: req.body.hostId,
    });
    await acceptInvite.update({ acceptedInvite: true, declineInvite: false });
    const newtoken = crypto.randomBytes(5).toString("hex").toUpperCase();

    await packageClass.update({ token: newtoken });
    if (acceptInvite) {
      await StaffPermission.create({
        staffId: newStaff.id,
        packageClassId: packageClass.id,
        hostId: acceptInvite.hostId,
        canUpdate: true,
        canCreate: true,
        canDelete: true,
      });
    }

    res.status(200).json({ msg: "accepted invite" });
  });
};

exports.acceptClass = async (req, res, next) => {
  const { token } = req.body;
  const tokenId =
    req.headers.authorization && req.headers.authorization.split(" ")[1];
  if (!tokenId) {
    return next(Error("PLease login"));
  }
  jwt.verify(tokenId, process.env.JWT_SECRET, async (err, staff) => {
    if (err) {
      return next(Error("Invalid error"));
    }

    const staffId = staff.id;
    const newStaff = await Staff.findOne({ where: { id: staffId } });

    if (!token) {
      return next(Error("Please provide the token sent to your email"));
    }
    const classSession = await ClassSession.findOne({ where: { token } });
    if (!classSession) {
      return next(Error("Invalid Token no invite with that code"));
    }

    const acceptInvite = await AcceptInvite.create({
      classSessionId: classSession.id,
      staffId: newStaff.id,
      hostId: req.body.hostId,
    });
    await acceptInvite.update({ acceptedInvite: true, declineInvite: false });
    const newtoken = crypto.randomBytes(5).toString("hex").toUpperCase();
    await classSession.update({ token: newtoken });
    if (acceptInvite) {
      await StaffPermission.create({
        staffId: newStaff.id,
        classSessionId: classSession.id,
        hostId: acceptInvite.hostId,
        canUpdate: true,
        canCreate: true,
        canDelete: true,
      });
    }

    res.status(200).json({ msg: "accepted invite" });
  });
};
