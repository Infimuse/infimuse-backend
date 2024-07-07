const express = require("express");
const router = express.Router();

const Document = require("../controllers/documentController");

router.route("/").post(Document.createDocument).get(Document.getAllDocument);
router
  .route("/:id")
  .get(Document.getOneDocument)
  .put(Document.updateDocument)
  .delete(Document.deleteDocument);
module.exports = router;
