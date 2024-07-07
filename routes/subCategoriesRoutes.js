const express = require("express");
const router = express.Router();

const SubCategory = require("../controllers/subCategoryController");

router
  .route("/")
  .post(SubCategory.createSubCategory)
  .get(SubCategory.getAllSubCategory);
router
  .route("/:id")
  .get(SubCategory.getOneSubCategory)
  .put(SubCategory.updateSubCategory)
  .delete(SubCategory.deleteSubCategory);
module.exports = router;
