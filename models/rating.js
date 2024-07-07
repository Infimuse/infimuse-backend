module.exports = (sequelize, Datatypes) => {
  const Rating = sequelize.define("rating", {
    rating: {
      type: Datatypes.DOUBLE,
      allowNull: false,
    },
    totalRating: Datatypes.DOUBLE,
  });
  return Rating;
};
