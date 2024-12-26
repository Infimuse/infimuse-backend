module.exports = (sequelize, DataTypes) => {
  const Waitlist = sequelize.define(
    "waitList",
    {
      email: { type: DataTypes.STRING },
    },
    {}
  );
  return Waitlist;
};
