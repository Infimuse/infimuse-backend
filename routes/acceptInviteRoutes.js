const express = require("express");
const router = express.Router();
const acceptInvite = require("../controllers/acceptInvite");
router.route("/workshops").post(acceptInvite.acceptWorkshop);
router.route("/packages").post(acceptInvite.acceptPackage);
router.route("/classes").post(acceptInvite.acceptClass);

module.exports = router;
