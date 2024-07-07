const express = require("express");
const router = express.Router();
const authController = require("./../controllers/authController");

const Cart = require("../controllers/cartController");

router
  .route("/")
  .post(Cart.createCart)
  .get(authController.customerProtect, Cart.getAllCart);
router
  .route("/:id")
  .get(Cart.getOneCart)
  .put(authController.customerProtect, Cart.updateCart)
  .delete(authController.customerProtect, Cart.deleteCart);
module.exports = router;
