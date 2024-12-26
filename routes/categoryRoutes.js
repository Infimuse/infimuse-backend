const express = require("express");
const router = express.Router();

const Category = require("../controllers/categoryController");
const category = require("../models/category");

router.route("/").post(Category.createCategory).get(Category.getCategories);

module.exports = router;
