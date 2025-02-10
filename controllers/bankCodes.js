const axios = require('axios');
const liveKey = process.env.PAYSTACK_LIVE_KEY;

exports.getKenyanBanks = async (req, res) => {
  try {
    const response = await axios.get('https://api.paystack.co/bank', {
      params: {
        country: 'kenya',
        perPage: 100
      },
      headers: {
        Authorization: `Bearer ${liveKey}`
      }
    });

    if (!response.data || !response.data.data) {
      return res.status(400).json({ error: "Could not fetch banks" });
    }

    const formattedBanks = response.data.data
      .map(bank => ({
        name: bank.name,
        code: bank.code,
        active: bank.active
      }))
      .filter(bank => bank.active);

    return res.status(200).json({
      message: "Banks retrieved successfully",
      data: formattedBanks
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};