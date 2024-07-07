module.exports = (sequelize, DataTypes) => {
  const StaffPermission = sequelize.define("staffPermission", {
    canCreate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    canUpdate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    canDelete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });
  return StaffPermission;
};
