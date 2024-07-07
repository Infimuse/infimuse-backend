"use strict";

module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    "notification",
    {
      content: DataTypes.STRING,
      viewed: DataTypes.BOOLEAN,
    },
    {}
  );

  return Notification;
};
//  Notification.belongsTo(models.Host, { foreignKey: "hostId" });
// Notification.belongsTo(models.Customer, { foreignKey: "customerId" });
