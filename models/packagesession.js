"use strict";
module.exports = (sequelize, DataTypes) => {
  const PackageSession = sequelize.define(
    "packageSession",
    {
      title: DataTypes.STRING,
      description: DataTypes.STRING,
      startTime: DataTypes.STRING,
      endTime: DataTypes.STRING,
      date: { type: DataTypes.DATE, allowNull: false },
      capacity: DataTypes.INTEGER,
      fullCapacity: DataTypes.INTEGER,
      status: {
        type: DataTypes.ENUM,
        values: ["upcoming", "canceled", "past"],
        allowNull: false,
        defaultValue: "upcoming",
      },
    },
    {}
  );

  return PackageSession;
};

// PackageSession.belongsTo(models.PackageClass, {
// foreignKey: "packageClassId",
