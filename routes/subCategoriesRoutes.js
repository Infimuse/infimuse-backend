const express = require("express");
const router = express.Router();

const SubCategory = require("../controllers/subCategoryController");

router.route("/").post(SubCategory.createSubcategory);

module.exports = router;
