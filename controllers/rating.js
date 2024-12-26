const factory = require("./factory");
const db = require("./../models");
const Rating = db.ratings;
const Host = db.hosts; // Ensure you import the Host model
const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET;

exports.createRating = async (req, res) => {
  const { message, rating } = req.body;

  const classSessionId = req.params.classId;
  const workshopId = req.params.workshopId;
  const experienceId = req.params.experienceId;
  const packageClassId = req.params.packageClassId;
  const hostId = req.params.hostId;
  const token = req.headers.authorization?.split(" ")[1]; // Correct the way to access the authorization header

  if (!token) {
    return res.status(401).json({ error: "Please log in." });
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, jwtSecret);
  } catch (error) {
    return res.status(401).json({ error: "Invalid token." });
  }

  const customerId = decodedToken.id;

  if (rating < 1 || rating > 5) {
    return res
      .status(400)
      .json({ error: "Rating must be between 1 and 5 stars." });
  }

  const rated = await Rating.findOne({ where: { customerId, hostId } });

  if (rated) {
    return res.status(403).json({ error: "You can only rate a host once." });
  }

  await Rating.create({
    message,
    hostId,
    classSessionId,
    workshopId,
    experienceId,
    packageClassId,
    customerId,
    rating,
  });

  const averageRating = await Rating.findOne({
    where: { hostId },
    attributes: [
      [db.Sequelize.fn("AVG", db.Sequelize.col("rating")), "averageRating"],
    ],
  });

  // Update the host's rating correctly
  await Host.update(
    { rating: averageRating.dataValues.averageRating }, // Set the new average rating
    { where: { id: hostId } } // Move the where clause here
  );

  return res.status(201).json({ message: "Rating created successfully." });
};
