const bcrypt = require("bcryptjs");
const crypto = require("crypto");

module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define(
    "customer",
    {
      firstName: { type: DataTypes.STRING, allowNull: false },
      lastName: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, unique: true, allowNull: false },
      role: {
        type: DataTypes.ENUM,
        values: ["user", "host"],
        defaultValue: "user",
      },
      phone: DataTypes.STRING,
      password: { type: DataTypes.STRING, allowNull: false },
      OTP: DataTypes.STRING,
      firstTimeLogin: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
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

  return Customer;
};
