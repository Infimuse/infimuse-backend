const db = require("../models");
const ClassSession = db.classSessions;
const PackageClass = db.packageClasses;
const Workshop = db.workshops;

exports.getClassToken = async (classId) => {
  try {
    const session = await ClassSession.findOne({
      attributes: ["token"],
      where: { id: classId },
    });
    return session ? session.token : null;
  } catch (error) {
    console.log(error);
    throw new Error("Error fetching class");
  }
};
exports.getPackageToken = async (classId) => {
  try {
    const session = await PackageClass.findOne({
      attributes: ["token"],
      where: { id: classId },
    });
    return session ? session.token : null;
  } catch (error) {
    console.log(error);
    throw new Error("Error fetching class");
  }
};

exports.getWorkshopId = async (classId) => {
  try {
    const session = await Workshop.findOne({
      attributes: ["token"],
      where: { id: classId },
    });
    return session ? session.token : null;
  } catch (error) {
    console.log(error);
    throw new Error("Error fetching class");
  }
};
