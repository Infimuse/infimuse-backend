module.exports = (sequelize, Datatypes) => {
  const Document = sequelize.define("document", {
    imageUrls: {
      type: Datatypes.STRING,
    },
  });
  return Document;
};
