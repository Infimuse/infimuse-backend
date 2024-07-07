"use strict";

module.exports = (sequelize, DataTypes) => {
  const Waitlist = sequelize.define(
    "waitList",
    {
      email: { type: DataTypes.STRING, unique: true },
    },
    {}
  );
  return Waitlist;
};

// Waitlist.belongsTo(models.ClassSession, { foreignKey: "classSessionId" });
// Waitlist.belongsTo(models.Workshop, { foreignKey: "workshopId" });
// Waitlist.belongsTo(models.PackageClass, { foreignKey: "packageClassId" });
