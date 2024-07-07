const factory = require("./factory");
const db = require("./../models");

const Comment = db.comments;

exports.createComment = factory.createDoc(Comment);
exports.getComment = factory.getOneDoc(Comment);
exports.getAllComments = factory.getAllDocs(Comment);
exports.updateComment = factory.updateDoc(Comment);
exports.deleteComment = factory.deleteDoc(Comment);
