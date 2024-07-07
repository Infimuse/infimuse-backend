const express = require("express");
const router = express.Router();
const mattermost = require("./../mattermost/channel");
router.post("/channels", mattermost.createMattermostChannel);
module.exports = router;
