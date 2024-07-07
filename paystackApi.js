const BaseApi = require("./baseApi");
const { convertObjectFromSnakeToCamelCase } = require("./snakeToCamelCase");
const dotenv = require("dotenv").config();
const paystackUrl = process.env.PAYSTACK_BASEURL;
const paystackKey = process.env.PAYSTACK_TEST_KEY;

const requestInit = {
  headers: {
    "Content-Type": "application/json",
    authorization: `Bearer ${paystackKey}`,
  },
};

class PaystackApi extends BaseApi {
  constructor() {
    super(paystackUrl);
  }

  async initializePayment(paymentDetails) {
    try {
      const response = await this.post(
        "/transaction/initialize",
        paymentDetails,
        undefined,
        requestInit
      );
      return convertObjectFromSnakeToCamelCase(response.data);
    } catch (error) {
      console.error("Error initializing payment:", error);
      throw error;
    }
  }

  async verifyPayment(paymentReference) {
    try {
      return this.get(
        `/transaction/verify/${paymentReference}`,
        undefined,
        requestInit
      );
    } catch (error) {
      console.error("Error verifying payment:", error);
      throw error;
    }
  }

  async transferPayouts(paymentDetails) {
    try {
      return this.post(`/transfer`, paymentDetails, undefined, requestInit);
    } catch (error) {
      console.error("Error transferring payouts:", error);
      throw error;
    }
  }
}

const paystackApiInstance = new PaystackApi();
module.exports = paystackApiInstance;
