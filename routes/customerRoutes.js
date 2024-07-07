const express = require("express");
const router = express.Router();

const customerController = require("../controllers/customerController");
const authController = require("../controllers/authController");
const hostAuth = require("../controllers/hostAuthController");
const mattermostUser = require("./../mattermost/users");

router.post("/mattermost/signup", mattermostUser.mattermostUser);
router.get(
  "/mattermost/users",

  mattermostUser.getMatterMostUsers
);
router.get(
  "/me",
  authController.customerLogin,
  customerController.getMe,
  customerController.getCustomer
);
router.post("/login", authController.customerLogin);
router.post("/forgortPassword", authController.forgortPassword);
router.put("/resetPassword/:token", authController.resetPassword);
// router.post("/login", authController.customerLogin);
router.post("/signup", authController.customerSignup);
router.route("/").get(hostAuth.hostProtect, customerController.getAllCustomers);

router
  .route("/:id")
  .put(customerController.updateCustomer)
  .get(customerController.getCustomer)
  .delete(customerController.deleteCustomer);
module.exports = router;
