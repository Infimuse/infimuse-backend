module.exports = (sequelize, DataTypes) => {
  const TicketHolder = sequelize.define("ticketHolder", {
    customerId: DataTypes.INTEGER,
    reference: DataTypes.STRING,
    hostId: DataTypes.STRING,
    workshopId: DataTypes.INTEGER,
    classSessionId: DataTypes.INTEGER,
    packageClassId: DataTypes.INTEGER,
    experienceId: DataTypes.INTEGER,
    guestId: DataTypes.INTEGER,
    groupTicket: { type: DataTypes.BOOLEAN, defaultValue: false },
    groupNumber: {
      type: DataTypes.INTEGER,
    },
  });
  return TicketHolder;
};
