module.exports = (sequelize, DataTypes) => {
  const Availabilty = sequelize.define("availability", {
    date: { type: DataTypes.DATE, allowNull: false },
    slot: {
      type: DataTypes.ENUM,
      values: ["7Am-9Am", "10Am-12Pm", "1:00Pm-2Pm", "3Pm-5Pm"],
      allowNull: false,
    },
    isBooked: { type: DataTypes.BOOLEAN, defaultValue: false },
  });
  return Availabilty;
};
