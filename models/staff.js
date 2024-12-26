const bcrypt = require("bcryptjs");
const crypto = require("crypto");

module.exports = (sequelize, DataTypes) => {
  const Staff = sequelize.define(
    "staff",
    {
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      numberOfSessions: { type: DataTypes.INTEGER },
      hoursCompleted: { type: DataTypes.STRING },
      earnings: { type: DataTypes.INTEGER },
      totalAttendees: { type: DataTypes.STRING },
      uniqueAttendees: { type: DataTypes.STRING },
      workingDays: { type: DataTypes.STRING },
      avgSessionRating: { type: DataTypes.STRING },
      role: {
        type: DataTypes.STRING,
        defaultValue: "STAFF",
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      imageUrl: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
      },
      phone: DataTypes.STRING,
      OTP: DataTypes.STRING,
      firstTimeLogin: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      password: DataTypes.STRING,
      bio: DataTypes.STRING,
      resetPasswordToken: DataTypes.STRING,
      passwordResetExpires: DataTypes.STRING,
      hostIdentifier: DataTypes.STRING,
    },
    {
      hooks: {
        beforeCreate: async function name(user) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);

          const OTP = crypto.randomBytes(5).toString("hex").toUpperCase();
          user.OTP = OTP;
        },
        beforeUpdate: async (user) => {
          if (user.changed("password")) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
        beforeSave: async (user) => {
          const resetToken = crypto.randomBytes(16).toString("hex");
          user.resetPasswordToken = resetToken;
          user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
          return resetToken;
        },
      },
    }
  );
  return Staff;
};
