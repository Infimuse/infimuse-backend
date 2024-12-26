module.exports = (sequelize, DataTypes) => {
  const SessionVenue = sequelize.define("sessionVenue", {
    name: DataTypes.STRING,
    locationPin: DataTypes.TEXT,
  });
  return SessionVenue;
};
