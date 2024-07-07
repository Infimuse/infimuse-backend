module.exports = (sequelize, DataTypes) => {
  const SubCategory = sequelize.define("subCategory", {
    title: DataTypes.STRING,
  });
  return SubCategory;
};
