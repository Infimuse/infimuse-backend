module.exports = (sequelize, DataTypes) => {
  const Wishlist = sequelize.define("wishlist", {
    status: DataTypes.BOOLEAN,
  });
  return Wishlist;
};
