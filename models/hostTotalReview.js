module.exports = (sequelize, DataTypes) => {
  const HostTotalReview = sequelize.define("hostTotalReview", {
    content: DataTypes.STRING,
    rating: DataTypes.INTEGER,
  });

  return HostTotalReview;
};
