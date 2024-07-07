const factory = require("./factory");
const db = require("./../models");
const Category = db.categories;

exports.createCategory = factory.createDoc(Category);
exports.getAllCategory = factory.getAllDocs(Category);
exports.getOneCategory = factory.getOneDoc(Category);
exports.updateCategory = factory.updateDoc(Category);
exports.deleteCategory = factory.deleteDoc(Category);
