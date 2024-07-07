const factory = require("./factory");
const db = require("./../models");

const hostReview = db.hostReviews;
// exports.createhostReview = factory.createDoc(hostReview);
exports.gethostReview = factory.getOneDoc(hostReview);
exports.getAllhostReviews = factory.getAllDocs(hostReview);
exports.updatehostReview = factory.updateDoc(hostReview);
exports.deletehostReview = factory.deleteDoc(hostReview);

exports.createhostReview = async (req, res) => {
  try {
    const doc = await hostReview.create({
      content: req.body.content,
      rating: req.body.rating,
      customerId: req.body.customerId,
      hostId: req.body.hostId,
    });
    console.log("req.body :" + req.body);
    res.status(200).json({ status: "Document created successful", doc });
  } catch (error) {
    console.log(error);
    if (error.name === "SequelizeValidationError") {
      res
        .status(400)
        .json({ status: "Validation error", errors: error.errors });
    }
  }
};
