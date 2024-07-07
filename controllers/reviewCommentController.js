const factory = require("./factory");
const db = require("./../models");

const ReviewComment = db.reviewComments;

exports.createReviewComment = factory.createDoc(ReviewComment);
exports.getReviewComment = factory.getOneDoc(ReviewComment);
exports.getAllReviewComments = factory.getAllDocs(ReviewComment);
exports.updateReviewComment = factory.updateDoc(ReviewComment);
exports.deleteReviewComment = factory.deleteDoc(ReviewComment);
