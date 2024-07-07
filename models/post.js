const { sequelize } = require(".");

module.exports = (sequelize, DataTypes) => {
  const Post = sequelize.define("post", {
    image: DataTypes.STRING,
    video: DataTypes.STRING,
    likes: DataTypes.INTEGER,
    caption: DataTypes.TEXT,
  });
  return Post;
};
