const https = require("https");
const factory = require("./factory");
const express = require("express");
const dotenv = require("dotenv").config();
const paystack_key = process.env.PAYSTACK_LIVE_KEY;
const db = require("./../models");
const instaSend = require;
const axios = require("axios");
const moment = require("moment");
const ClassSession = db.classSessions;
const app = express();
const PaymentTransaction = db.paymentTransactions;

exports.getPaymentTransaction = factory.getOneDoc(PaymentTransaction);
exports.getAllPaymentTransactions = factory.getAllDocs(PaymentTransaction);
exports.updatePaymentTransaction = factory.updateDoc(PaymentTransaction);
exports.deletePaymentTransaction = factory.deleteDoc(PaymentTransaction);
