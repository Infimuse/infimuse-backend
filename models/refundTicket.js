module.exports = (sequelize, DataTypes) => {
  const RefundTicket = sequelize.define("refundTicket", {
    amount: DataTypes.DOUBLE,
    ticketId: DataTypes.STRING,
    status: DataTypes.BOOLEAN,
  });
  return RefundTicket;
};
