"use strict";
module.exports = (sequelize, DataTypes) => {
  const ReviewComment = sequelize.define(
    "reviewComment",
    {
      content: DataTypes.STRING,
      rating: DataTypes.DECIMAL,
    },
    {}
  );

  return ReviewComment;
};

// ReviewComment.belongsTo(models.Host, { foreignKey: "hostId" });
