const express = require("express");
const router = express.Router();

const Category = require("../controllers/categoryController");

router.route("/").post(Category.createCategory).get(Category.getAllCategory);
router
  .route("/:id")
  .get(Category.getOneCategory)
  .put(Category.updateCategory)
  .delete(Category.deleteCategory);
module.exports = router;
