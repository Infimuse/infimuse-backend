const bcrypt = require("bcryptjs");
const crypto = require("crypto");
module.exports = (sequelize, DataTypes) => {
  const Guest = sequelize.define(
    "guest",
    {
      phone: { type: DataTypes.STRING, allowNull: false },
      firstName: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false },
      OTP: DataTypes.STRING,
    },
    {
      hooks: {
        beforeCreate: (guest) => {
          const OTP = crypto.randomBytes(3).toString("hex").toUpperCase();
          guest.OTP = OTP;
        },
      },
    }
  );

  return Guest;
};
