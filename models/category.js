module.exports = (sequelize, DataTypes) => {
  const category = sequelize.define("category", {
    name: DataTypes.STRING,
  });
  return category;
};
