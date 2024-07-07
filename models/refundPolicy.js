module.exports = async (sequelize, DataTypes) => {
  const RefundPolicy = sequelize.define("refundPolicy", {
    policy: {
      type: DataTypes.ENUM,
      values: ["flexible", "moderate", "strict"],
      allowNull: false,
    },
    sessionAttended: {
      type: DataTypes.STRING,
    },
  });
  return RefundPolicy;
};
