const factory = require("./factory");
const db = require("./../models");
const Document = db.documents;

exports.createDocument = factory.createDoc(Document);
exports.getAllDocument = factory.getAllDocs(Document);
exports.getOneDocument = factory.getOneDoc(Document);
exports.updateDocument = factory.updateDoc(Document);
exports.deleteDocument = factory.deleteDoc(Document);
