const makeHttpRequest = require("./paystackMakeHttpsRequest").makeHttpRequest;
const paystackKey = process.env.PAYSTACK_TEST_KEY;
exports.paystackMiddleware = (req, res, next) => {
  const options = {
    hostname: "api.paystack.co",
    port: 443,
    path: "/bank?currency=KES&type=mobile_money",
    method: "GET",
    headers: {
      Authorization: `Bearer ${paystackKey}`,
    },
  };

  makeHttpRequest(options)
    .then((response) => {
      req.paystackResponse = response;
      next();
    })
    .catch((error) => {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal server error" });
    });
};
