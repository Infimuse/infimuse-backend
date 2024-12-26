const bcrypt = require("bcryptjs");
const crypto = require("crypto");

module.exports = (sequelize, DataTypes) => {
  const Admin = sequelize.define(
    "admin",
    {
      firstName: DataTypes.STRING,
      email: { type: DataTypes.STRING, unique: true, allowNull: false },
      role: {
        type: DataTypes.ENUM,
        values: ["user", "host", "admin"],
        defaultValue: "admin",
      },
      password: { type: DataTypes.STRING, allowNull: false },
      OTP: DataTypes.STRING,
      resetPasswordToken: { type: DataTypes.STRING, defaultValue: "" },
      passwordResetExpires: DataTypes.DATE,
    },
    {
      hooks: {
        beforeCreate: async (user) => {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
          const OTP = crypto.randomBytes(3).toString("hex").toUpperCase();
          user.OTP = OTP;
        },
        beforeUpdate: async (user) => {
          if (user.changed("password")) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
        beforeSave: async (user) => {
          const resetToken = crypto.randomBytes(32).toString("hex");
          user.resetPasswordToken = resetToken;
          user.passwordResetExpires = Date.now() + 10 * 60 * 1000;

          return resetToken;
        },
      },
    }
  );

  return Admin;
};
