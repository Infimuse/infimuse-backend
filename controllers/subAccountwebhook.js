
const db= require('../models');
const Host = db.hosts
const SubAccount = db.subAccounts
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
          console.log('Host not found for webhook event:', data);
          return res.sendStatus(200); 
        }
  
        await SubAccount.create({
          hostId: host.id,
          firstName: host.firstName,
          paystack_subaccount_code: data.subaccount_code,
          bank_account_number: data.account_number,
          bank_code: data.settlement_bank,
          business_name: data.business_name,
          email: data.email
        });
  
        await host.update({ haveAccount: true });
      }
  
      res.sendStatus(200);
    } catch (error) {
      console.error('Webhook handling error:', error);
      res.sendStatus(200); 
    }
  };
  