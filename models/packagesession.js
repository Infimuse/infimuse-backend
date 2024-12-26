"use strict";
module.exports = (sequelize, DataTypes) => {
  const PackageSession = sequelize.define(
    "packageSession",
    {
      title: DataTypes.STRING,
      description: DataTypes.STRING,
      startDate: DataTypes.DATE,
      endDate: DataTypes.DATE,
      date: { type: DataTypes.DATE, allowNull: false },
      capacity: DataTypes.INTEGER,
      fullCapacity: DataTypes.INTEGER,
      price: DataTypes.DOUBLE,
      status: {
        type: DataTypes.ENUM,
        values: ["upcoming", "canceled", "past"],
        allowNull: false,
        defaultValue: "upcoming",
      },
      attendance: { type: DataTypes.INTEGER, defaultValue: 0 },
      lastScannedAt: { type: DataTypes.DATE },
      venue: {
        type: DataTypes.ENUM,
        values: ["host venue", "custom venue"],
        defaultValue: "host venue",
      },
    },
    {}
  );

  return PackageSession;
};

// PackageSession.belongsTo(models.PackageClass, {
// foreignKey: "packageClassId",
