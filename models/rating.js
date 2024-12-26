module.exports = (sequelize, Datatypes) => {
  const Rating = sequelize.define("rating", {
    rating: {
      type: Datatypes.DOUBLE,
      allowNull: false,
    },
    totalRating: Datatypes.DOUBLE,
    message: Datatypes.TEXT,
  });
  return Rating;
};
