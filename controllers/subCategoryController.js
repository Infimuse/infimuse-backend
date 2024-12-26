const db = require("../models");
const Subcategory = db.subCategories;
const Category = db.categories;
// Create a new subcategory
exports.createSubcategory = async (req, res) => {
  try {
    const { name, categoryId } = req.body;

    if (!categoryId) {
      return res.status(400).json({ error: "Category ID is required" });
    }
    const category = await Category.findOne({
      where: { id: categoryId },
    });
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    const subcategory = await Subcategory.create({ name, categoryId });
    return res.status(201).json(subcategory);
  } catch (error) {
    return res.status(500).json({ error: "Error creating subcategory" });
  }
};
