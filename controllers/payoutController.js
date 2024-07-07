const factory = require("./factory");
const db = require("./../models");
const Payout = db.payouts;
const Recipient = db.transferRecipient;
const https = require("https");
const paystackKey = process.env.PAYSTACK_TEST_KEY;
const reference = process.env.PAYSTACK_REFERENCE;

module.exports.getPayout = factory.getOneDoc(Payout);
module.exports.getAllPayouts = factory.getAllDocs(Payout);
module.exports.updatePayout = factory.updateDoc(Payout);
module.exports.deletePayout = factory.deleteDoc(Payout);

// module.exports.createPayout = async (request, response) => {
//   const recipient = request.body.recipient;
//   const amount = request.body.amount;

//   const existingCode = await Recipient.findOne({
//     where: { recipient_code: recipient },
//   });

//   if (!existingCode) {
//     return response
//       .status(404)
//       .json({ msg: "Please add yourself to the transfer recipient list" });
//   }

//   const params = JSON.stringify({
//     source: "balance",
//     reason: request.body.reason || "Savings", // Make reason configurable
//     amount,
//     reference,
//     recipient,
//   });

//   const options = {
//     hostname: "api.paystack.co",
//     port: 443,
//     path: "/transfer",
//     method: "POST",
//     headers: {
//       Authorization: `Bearer ${paystackKey}`,
//       "Content-Type": "application/json",
//     },
//   };

//   const req = https
//     .request(options, (res) => {
//       let data = "";

//       res.on("data", (chunk) => {
//         data += chunk;
//       });

//       res.on("end", () => {
//         const responseData = JSON.parse(data);
//         if (responseData.status === false) {
//           return response.status(404).json({ error: responseData });
//         }
//       });
//     })
//     .on("error", (error) => {
//       console.error(error);
//     });

//   req.write(params);
//   req.end();
// };
