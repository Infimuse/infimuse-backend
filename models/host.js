"use strict";
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

module.exports = (sequelize, DataTypes) => {
  const Host = sequelize.define(
    "host",
    {
      firstName: DataTypes.STRING,
      bio: DataTypes.STRING,
      imageUrl1: DataTypes.TEXT,
      imageUrl2: DataTypes.TEXT,
      imageUrl3: DataTypes.TEXT,
      qualifications: DataTypes.STRING,
      verified: { type: DataTypes.BOOLEAN, defaultValue: false },
      rating: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },
      hostTitle: {
        type: DataTypes.ENUM,
        values: ["INDIVIDUAL", "PROFESSIONAL", "BUSINESS", "STAFF"],
      },
      nationalId: DataTypes.INTEGER,
      experienceYears: DataTypes.INTEGER,
      status: DataTypes.BOOLEAN,
      email: {
        type: DataTypes.STRING,
        unique: true,
      },
      identifier: DataTypes.STRING,
      phone: DataTypes.STRING,
      password: DataTypes.STRING,
      OTP: { type: DataTypes.STRING },
      resetPasswordToken: { type: DataTypes.STRING, defaultValue: "" },
      passwordResetExpires: DataTypes.STRING,
      firstTimeLogin: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      legit: { type: DataTypes.BOOLEAN, defaultValue: false },
      vetted: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      hooks: {
        beforeCreate: async (host) => {
          const salt = await bcrypt.genSalt(12);
          host.password = await bcrypt.hash(host.password, salt);

          const otp = crypto.randomBytes(3).toString("hex").toUpperCase();
          host.OTP = otp;
          const identifier = crypto
            .randomBytes(3)
            .toString("hex")
            .toUpperCase();
          host.identifier = identifier;
        },
        beforeUpdate: async (host) => {
          if (host.changed("password")) {
            const salt = await bcrypt.genSalt(12);
            host.password = await bcrypt.hash(host.password, salt);
          }
        },
        beforeSave: async function (user) {
          const resetToken = crypto.randomBytes(16).toString("hex");

          user.resetPasswordToken = resetToken;
          user.passwordResetExpires = Date.now() + 10 * 60 + 1000;
          return resetToken;
        },
      },
    }
  );
  return Host;
};
