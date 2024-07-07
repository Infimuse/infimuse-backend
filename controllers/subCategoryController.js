const factory = require("./factory");
const db = require("./../models");
const SubCategory = db.subCategories;

exports.createSubCategory = factory.createDoc(SubCategory);
exports.getAllSubCategory = factory.getAllDocs(SubCategory);
exports.getOneSubCategory = factory.getOneDoc(SubCategory);
exports.updateSubCategory = factory.updateDoc(SubCategory);
exports.deleteSubCategory = factory.deleteDoc(SubCategory);
