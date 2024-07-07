module.exports = (sequelize, DataTypes) => {
  const HostReview = sequelize.define(
    "hostReview",
    {
      content: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      timestamps: true,
    }
  );

  return HostReview;
};
