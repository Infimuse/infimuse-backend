const factory = require("./factory");
const db = require("./../models");
const WishList = db.wishlists;

exports.createWishList = factory.createDoc(WishList);
exports.getAllWishList = factory.getAllDocs(WishList);
exports.getOneWishList = factory.getOneDoc(WishList);
exports.updateWishList = factory.updateDoc(WishList);
exports.deleteWishList = factory.deleteDoc(WishList);
