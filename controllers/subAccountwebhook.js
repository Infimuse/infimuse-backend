// webhookController.js
const crypto = require('crypto');
const db = require('../models');
const Host = db.hosts;
const SubAccount = db.subAccounts;

exports.handlePaystackWebhook = async (req, res) => {
  try {
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_TEST_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');
    
    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body;

    if (event.event === 'subaccount.created') {
      const { data } = event;

      const host = await Host.findOne({
        where: { email: data.email }
      });

      if (!host) {
        return res.sendStatus(200);
      }

      // Check for existing subaccount
      const existingSubaccount = await SubAccount.findOne({
        where: { paystack_subaccount_code: data.subaccount_code }
      });

      if (existingSubaccount) {
        return res.sendStatus(200);
      }

      const subaccount=await SubAccount.create({
        hostId: host.id,
        firstName: host.firstName,
        paystack_subaccount_code: data.subaccount_code,
        bank_account_number: data.account_number,
        bank_code: data.settlement_bank,
        business_name: data.business_name,
        email: data.email
      });
      await subaccount.save();
      await host.update({ haveAccount: true });
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error('Webhook handling error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    return res.sendStatus(200);
  }
};
