module.exports = (sequelize, DataTypes) => {
  const Community = sequelize.define("community", {
    name: DataTypes.STRING,
  });
  return Community;
};
