module.exports = (sequelize, DataTypes) => {
  const ClassTemplate = sequelize.define("classTemplate", {
    classType: {
      type: DataTypes.ENUM,
      values: ["CLASS", "PACKAGE", "WORKSHOP"],
      allowNull: false,
    },
    classId: DataTypes.INTEGER,
    count: DataTypes.INTEGER,
  });
  return ClassTemplate;
};
