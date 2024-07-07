const https = require("https");
const db = require("../../models");
const Recipient = db.transferRecipient;
const paystackKey = process.env.PAYSTACK_LIVE_KEY;
const reference = process.env.PAYSTACK_REFERENCE;

module.exports.createPayout = async (request, response) => {
  const recipient = request.body.recipient;
  const amount = request.body.amount;

  const existingCode = await Recipient.findOne({
    where: { recipient_code: recipient },
  });

  if (!existingCode) {
    return response
      .status(404)
      .json({ msg: "Please add yourself to the transfer recipient list" });
  }

  const params = JSON.stringify({
    source: "balance",
    reason: request.body.reason || "Savings",
    amount,
    reference,
    recipient,
  });

  const options = {
    hostname: "api.paystack.co",
    port: 443,
    path: "/transfer",
    method: "POST",
    headers: {
      Authorization: `Bearer ${paystackKey}`,
      "Content-Type": "application/json",
    },
  };

  return new Promise((resolve, reject) => {
    const req = https
      .request(options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          const responseData = JSON.parse(data);
          if (responseData.status === true) {
            console.log(responseData);
            return response.status(404).json({ error: responseData });
          } else {
            console.log(responseData);
            response.status(200).json(responseData);
            resolve(responseData);
          }
        });
      })
      .on("error", (error) => {
        console.error(error);
        reject(error);
      });

    req.write(params);
    req.end();
  });
};
