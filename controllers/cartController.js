const factory = require("./factory");
const db = require("./../models");
const Cart = db.carts;

exports.createCart = factory.createDoc(Cart);
exports.getAllCart = factory.getAllDocs(Cart);
exports.getOneCart = factory.getOneDoc(Cart);
exports.updateCart = factory.updateDoc(Cart);
exports.deleteCart = factory.deleteDoc(Cart);
