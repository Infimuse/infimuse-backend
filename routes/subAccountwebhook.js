const express = require('express');
const router = express.Router();
const handlePaystackWebhook  = require('../controllers/subAccountwebhook');

router.post('/', handlePaystackWebhook.handlePaystackWebhook);

module.exports = router;