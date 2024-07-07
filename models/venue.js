const { DataTypes } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const Venue = sequelize.define("venue", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    accessibility: {
      type: DataTypes.STRING,
    },
    imageUrl1: {
      type: DataTypes.STRING,
    },
    imageUrl2: {
      type: DataTypes.STRING,
    },
    imageUrl3: {
      type: DataTypes.STRING,
    },
    venueType: {
      type: DataTypes.STRING,
    },
    capacity: {
      type: DataTypes.INTEGER,
    },
    amenities: {
      type: DataTypes.STRING,
    },
    noiseLevel: {
      type: DataTypes.STRING,
    },
    parking: DataTypes.BOOLEAN,
    additionalInfo: DataTypes.STRING,
    rules: DataTypes.STRING,
  });
  return Venue;
};
