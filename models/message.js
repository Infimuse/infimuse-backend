module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define("message", {
    roomId: DataTypes.INTEGER,
    userId: DataTypes.INTEGER,
    message: DataTypes.STRING,
  });

  return Message;
};
