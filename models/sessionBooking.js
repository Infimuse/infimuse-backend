module.exports = (sequelize, DataTypes) => {
  const SessionBooking = sequelize.define("sessionBooking", {
    userFirstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userPhone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    venueName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    time: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    customVenue: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    locationPin: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });

  return SessionBooking;
};
