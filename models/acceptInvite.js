module.exports = (sequelize, DataTypes) => {
  const AccesptInvite = sequelize.define("acceptInvite", {
    acceptedInvite: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    declineInvite: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  });
  return AccesptInvite;
};
