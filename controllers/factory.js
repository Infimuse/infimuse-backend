// const { Model } = require("sequelize");
const { Op, Model } = require("sequelize");
const { Sequelize } = require("../models");
const db = require("./../models");
const Location = db.locations;
const jwt = require("jsonwebtoken");
const secretKey = process.env.JWT_SECRET;
const CancelTicket = db.cancelTickets;
const Guest = db.guests;
const Customer = db.customers;
const PaymentTransaction = db.paymentTransactions;
const TicketHolder = db.ticketHolders;
const ClassSession = db.classSessions;

// createDoc
exports.createDoc = (Model) => async (req, res) => {
  try {
    const doc = await Model.create(req.body);

    return res.status(200).json({ status: "Document created successful", doc });
  } catch (error) {
    return res.status(500).json({ status: "Internal server error" });
  }
};

// get All docs

exports.getAllDocs = (Model) => async (req, res) => {
  try {
    // paginate
    const page = parseInt(req.query.page, 15) || 1;
    const limit = parseInt(req.query.limit, 15) || 15;
    const offset = (page - 1) * limit;
    // sorting
    const sortFields = ["location", "price"];
    const sortBy = req.query.sort;
    const order = sortFields.includes(sortBy) ? sortBy : "createdAt";

    // location Filter
    const locationFilter = req.query.location;
    const whereClause = locationFilter ? { location: locationFilter } : {};
    const docs = await Model.findAll({
      limit: limit,
      offset: offset,
      order: [[order, "DESC"]],
      where: whereClause,
    });
    return res
      .status(200)
      .json({ result: "Success", TotalDocs: docs.length, Document: docs });
  } catch (error) {
    return res.status(500).json({ Error: "internal server error" });
  }
};

// update docs

exports.updateDoc = (Model, id) => async (req, res, next) => {
  try {
    const doc = await Model.findOne({ where: { id: req.params.id } });

    if (!doc) {
      return next(res.status(404).json({ msg: "Not found" }));
    }

    const updateDoc = await doc.update(req.body);
    return res.status(200).json({ result: "updated", NewDocument: updateDoc });
  } catch (error) {
    return res.status(500).json({ Error: error });
  }
};

// get a single Doc
exports.getOneDoc = (Model, id) => async (req, res, next) => {
  try {
    const doc = await Model.findOne({ where: { id: req.params.id } });

    if (!doc) {
      return res.status(404).render("error404", { error: "Not found" });
    }
    return res.status(200).json({ result: "Success", Data: doc });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ Error: "Internal serever error" });
  }
};

// delete Doc
exports.deleteDoc = (Model) => async (req, res) => {
  try {
    const doc = await Model.findOne({ where: { id: req.params.id } });
    if (doc) {
      Model.destroy({ where: { id: req.params.id } });
      return res.status(200).json({ message: "Data deleted successful" });
    }
  } catch (error) {
    return res.status(500).json({ Error: "Internal server error" });
  }
};
exports.getWithin = (Model) => async (req, res, next) => {
  try {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(",");
    const earthRadius = 6371;
    const radius = unit === "miles" ? distance / 0.621371 : distance;

    if (!lat || !lng) {
      next(Error("Please provide lat and long"));
      return; // Ensure to return after calling next to avoid further execution
    }

    const doc = await Model.findAll({
      include: [
        {
          model: Location,
          as: "location",
          attributes: ["latitude", "longitude"],
          where: Sequelize.literal(`
        ST_DISTANCE_SPHERE(
          POINT(${parseFloat(lng)}, ${parseFloat(lat)}),
          POINT(\`location\`.longitude, \`location\`.latitude)
        ) <= ${radius}
      `),
        },
      ],
      logging: console.log,
    });

    return res.status(200).json({ status: "success", total: doc.length, doc });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ Error: "Internal servere error" });
  }
};

exports.getUpcoming = (Model) => async (req, res) => {
  try {
    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Please login" });
    }

    const decodedToken = jwt.verify(token, secretKey);
    const hostId = decodedToken.id;
    const dateToday = new Date().getTime();

    const upcoming = await Model.findAll({
      where: {
        startDate: {
          [Op.gte]: dateToday,
        },
        hostId,
      },
    });

    return res.status(200).json({ upcoming });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getHistory = (Model) => async (req, res) => {
  try {
    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Please login" });
    }

    const decodedToken = jwt.verify(token, secretKey);
    const hostId = decodedToken.id;
    const dateToday = new Date().getTime();

    const pastListings = await Model.findAll({
      where: {
        endDate: {
          [Op.lte]: dateToday,
        },
        hostId,
      },
    });

    return res.status(200).json({ pastListings });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAllCategory = (category) => async (req, res) => {
  try {
    const classCategory = await ClassSession.findAll({
      where: { classCategory: category },
    });
    if (classCategory.length === 0) {
      return res.status(404).json({ error: "no document found" });
    }
    return res
      .status(200)
      .json({ success: classCategory.length, classCategory });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ err: "Internal server error" });
  }
};

exports.getAllHosts = (Model) => async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const offset = (page - 1) * limit;

    // Sorting
    const sortFields = ["location", "price", "rating"];
    const sortBy = req.query.sort || "rating";
    const order = sortFields.includes(sortBy) ? sortBy : "rating";
    const sortOrder = order === "rating" ? "DESC" : "ASC";

    // Location Filter
    const locationFilter = req.query.location;
    const whereClause = locationFilter ? { location: locationFilter } : {};

    // Fetch documents
    const docs = await Model.findAll({
      limit,
      offset,
      order: [
        [order, "DESC"], // Sort by rating in descending order
        ["createdAt", "DESC"], // Then sort by creation date in descending order
      ],
      where: whereClause,
    });

    return res.status(200).json({
      result: "Success",
      TotalDocs: docs.length,
      Document: docs,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ Error: "Internal server error" });
  }
};
