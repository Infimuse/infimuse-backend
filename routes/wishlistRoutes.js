const express = require("express");
const router = express.Router();

const Wishlist = require("../controllers/wishlistsController");

router.route("/").post(Wishlist.createWishList).get(Wishlist.getAllWishList);
router
  .route("/:id")
  .get(Wishlist.getOneWishList)
  .put(Wishlist.updateWishList)
  .delete(Wishlist.deleteWishList);
module.exports = router;
