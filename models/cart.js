module.exports = (sequelize, DataTypes) => {
  const Cart = sequelize.define("cart", {
    status: DataTypes.BOOLEAN,
  });

  return Cart;
};
