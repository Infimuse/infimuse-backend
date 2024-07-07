module.exports = (sequelize, DataTypes) => {
  const Location = sequelize.define(
    "location",
    {
      latitude: DataTypes.DOUBLE,
      longitude: DataTypes.DOUBLE,
      location: DataTypes.STRING,
      status: DataTypes.BOOLEAN,
    },
    {}
  );

  // Location.belongsTo(models.Workshop, { foreignKey: "workshopId" });
  return Location;
};
