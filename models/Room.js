const crypto = require("crypto");
module.exports = (sequelize, DataTypes) => {
  const Room = sequelize.define(
    "room",
    {
      name: {
        type: DataTypes.STRING,
      },
      chatRoomId: {
        type: DataTypes.STRING,
      },
    },
    {
      hooks: {
        beforeCreate: (room) => {
          const randomId = crypto.randomBytes(3).toString("hex").toLowerCase();
          room.chatRoomId = randomId;
        },
      },
    }
  );
  return Room;
};
