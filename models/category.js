module.exports = (sequelize, DataTypes) => {
  const category = sequelize.define("category", {
    title: DataTypes.STRING,
  });
  return category;
};
