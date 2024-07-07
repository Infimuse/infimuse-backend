"use strict";

module.exports = (sequelize, DataTypes) => {
  const WorkshopClass = sequelize.define(
    "workshopClass",
    {
      title: DataTypes.STRING,
      description: DataTypes.STRING,
      date: { type: DataTypes.DATE, allowNull: false },
      startTime: DataTypes.STRING,
      endTime: DataTypes.STRING,
      status: {
        type: DataTypes.ENUM,
        values: ["upcoming", "canceled", "past"],
        allowNull: false,
        defaultValue: "upcoming",
      },
    },
    {}
  );
  return WorkshopClass;
};
