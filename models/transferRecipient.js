module.exports = (sequelize, DataTypes) => {
  const TransferRecipient = sequelize.define("TransferRecipient", {
    name: {
      type: DataTypes.STRING,
    },
    recipient_code: {
      type: DataTypes.STRING,
    },
    type: {
      type: DataTypes.STRING,
    },
  });
  return TransferRecipient;
};
