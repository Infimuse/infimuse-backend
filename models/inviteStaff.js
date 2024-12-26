const { DataTypes } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const Invites = sequelize.define("invites", {
    email: DataTypes.STRING,
    accepted: { type: DataTypes.BOOLEAN, defaultValue: false },
    assignedTemplates: { type: DataTypes.INTEGER, defaultValue: 0 },
    postedTemplates: { type: DataTypes.INTEGER, defaultValue: 0 },
    inviteExpiresAt: DataTypes.DATE,
  });
  return Invites;
};
