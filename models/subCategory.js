module.exports = (sequelize, DataTypes) => {
  const SubCategory = sequelize.define("subCategory", {
    name: DataTypes.STRING,
  });
  return SubCategory;
};
