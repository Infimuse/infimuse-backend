const db = require("../models");
const Category = db.categories;
const SubCategory = db.subCategories;
// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const name = req.body.name;
    const category = await Category.create({ name });
    return res.status(201).json({ msg: "category created", category });
  } catch (error) {
    return res.status(500).json({ error: "Error creating category" });
  }
};

// Get all categories with their subcategories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [
        {
          model: SubCategory,
          as: "subCategory", // Match the alias defined in the association
        },
      ],
    });
    return res.status(200).json(categories);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error fetching categories" });
  }
};
