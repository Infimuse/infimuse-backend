const { Sequelize, DataTypes } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const ServerApproval = sequelize.define("serverApproval", {
    reference: DataTypes.STRING,
    transfer_code: DataTypes.STRING,
    processed: { type: DataTypes.BOOLEAN, defaultValue: false },
    amount: DataTypes.INTEGER,
  });
  return ServerApproval;
};
