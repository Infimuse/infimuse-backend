const express = require("express");
const app = express();
const router = express.Router();
const payoutCotroller = require("../controllers/payoutController");
const hostAuthController = require("./../controllers/hostAuthController");

router
  .route("/")
  .get(hostAuthController.hostProtect, payoutCotroller.getAllPayouts);

router
  .route("/:id")
  .put(hostAuthController.hostProtect, payoutCotroller.updatePayout)
  .get(hostAuthController.hostProtect, payoutCotroller.getPayout)
  .delete(hostAuthController.hostProtect, payoutCotroller.deletePayout);

module.exports = router;
