module.exports = (sequelize, DataTypes) => {
  const CancelTicket = sequelize.define("cancelTicket", {
    TicketId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    amount: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phoneNumber: {
      type: DataTypes.STRING,
    },
    refunded: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    refundPolicy: {
      type: DataTypes.ENUM,
      values: ["flexible", "moderate", "strict"],
    },
    SessionAttendance: {
      type: DataTypes.STRING,
    },
  });
  return CancelTicket;
};
