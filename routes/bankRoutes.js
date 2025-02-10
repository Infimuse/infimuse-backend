const express = require('express');
const router = express.Router();
const bankController = require('../controllers/bankCodes');

router.get('/', bankController.getKenyanBanks);
module.exports = router;