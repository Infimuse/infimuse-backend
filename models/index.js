const dotenv = require("dotenv");
const { Sequelize, DataTypes } = require("sequelize");

dotenv.config();

const db_name = process.env.DATABASE_NAME;
const db_username = process.env.DATABASE_USERNAME;
const db_password = process.env.DATABASE_PASSWORD;
const db_host = process.env.DATABASE_HOST;
const db_dialect = process.env.DATABASE_DIALECT;
const db_port = process.env.DATABASE_PORT || 3306;

const sequelize = new Sequelize(db_name, db_username, db_password, {
  host: db_host,
  dialect: db_dialect,
  port: db_port,
  logging: false,
  define: {
    timestamps: true,
  },
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // Required for Azure MySQL
    },
  },
  sync: {
    alter: true,
  },
});

sequelize
  .authenticate()
  .then(() => console.log("Connected to Azure MySQL successfully!"))
  .catch((err) => console.error("Error connecting to Azure MySQL:", err));


const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.ratings = require("./rating")(sequelize, DataTypes);
db.admins = require("./admin")(sequelize, DataTypes);
db.classSessions = require("./classsession")(sequelize, DataTypes);
db.serverApproval = require("./serverApproval")(sequelize, DataTypes);
db.wallets = require("./wallet")(sequelize, DataTypes);
db.ticketHolders = require("./ticketHolder")(sequelize, DataTypes);
db.experienceTickets = require("./experienceTicket")(sequelize, DataTypes);
db.classTickets = require("./classticket")(sequelize, DataTypes);
db.customers = require("./customer")(sequelize, DataTypes);
db.guests = require("./guest")(sequelize, DataTypes);
db.hosts = require("./host")(sequelize, DataTypes);
db.locations = require("./location")(sequelize, DataTypes);
db.notifications = require("./Notification")(sequelize, DataTypes);
db.packageClasses = require("./packageclass")(sequelize, DataTypes);
db.packageSessions = require("./packagesession")(sequelize, DataTypes);
db.packageTickets = require("./packageticket")(sequelize, DataTypes);
db.paymentTransactions = require("./paymenttransaction")(sequelize, DataTypes);
db.payouts = require("./payout")(sequelize, DataTypes);
db.reviewComments = require("./reviewcomment")(sequelize, DataTypes);
db.waitlists = require("./waitlist")(sequelize, DataTypes);
db.workshops = require("./workshop")(sequelize, DataTypes);
db.freeworkshops = require("./freeWorkshop")(sequelize, DataTypes);
db.freeClassSessions = require("./freeClassSession")(sequelize, DataTypes);
db.freeExperiences = require("./freeExperience")(sequelize, DataTypes);
db.freePackageClasses = require("./freePackageClass")(sequelize, DataTypes);
db.workshopClasses = require("./workshopclass")(sequelize, DataTypes);
db.workshopTickets = require("./workshopticket")(sequelize, DataTypes);
db.documents = require("./document")(sequelize, DataTypes);
db.categories = require("./category")(sequelize, DataTypes);
db.rooms = require("./Room")(sequelize, DataTypes);
db.subCategories = require("./subCategory")(sequelize, DataTypes);
db.carts = require("./cart")(sequelize, DataTypes);
db.hostReviews = require("./hostReview")(sequelize, DataTypes);
db.hostTotalReviews = require("./hostTotalReview")(sequelize, DataTypes);
db.wishlists = require("./wishlist")(sequelize, DataTypes);
db.refundTickets = require("./refundTicket")(sequelize, DataTypes);
db.cancelTickets = require("./canceledTicket")(sequelize, DataTypes);
db.hostPlans = require("./hostPlan")(sequelize, DataTypes);
db.comments = require("./comment")(sequelize, DataTypes);
db.transferRecipient = require("./transferRecipient")(sequelize, DataTypes);
db.venues = require("./venue")(sequelize, DataTypes);
db.refundPolicies = require("./refundPolicy")(sequelize, DataTypes);
db.classTemplates = require("./classTemplate")(sequelize, DataTypes);
db.staffs = require("./staff")(sequelize, DataTypes);
db.messages = require("./message")(sequelize, DataTypes);
db.acceptInvites = require("./acceptInvite")(sequelize, DataTypes);
db.staffPermissions = require("./staffPermission")(sequelize, DataTypes);
db.monthlySubsRecord = require("./monthlySubsRecord")(sequelize, DataTypes);
db.DST = require("./DST")(sequelize, DataTypes);
db.sessionBookings = require("./sessionBooking")(sequelize, DataTypes);
db.monthlyRevenue = require("./monthlyRevenue")(sequelize, DataTypes);
db.InfimuseAccount = require("./infimuseAccount")(sequelize, DataTypes);
db.commissions = require("./commision")(sequelize, DataTypes);
db.hostPaymentPlanTransactions = require("./hostPaymentPlanTransaction")(
  sequelize,
  DataTypes
);
db.experiences = require("./experience")(sequelize, DataTypes);
db.withdrawals = require("./withdrawal")(sequelize, DataTypes);
db.invites = require("./inviteStaff")(sequelize, DataTypes);
db.communities = require("./community")(sequelize, DataTypes);
db.sessionVenues = require("./sessionVenue")(sequelize, DataTypes);
db.posts = require("./post")(sequelize, DataTypes);
db.availabilities = require("./availability")(sequelize, DataTypes);
db.communityMemberships = require("./communityMembership")(
  sequelize,
  DataTypes
);
db.availabilities.hasOne(db.sessionBookings, {
  as: "sessionBooking",
  foreignKey: "availabilityId",
});
db.sessionBookings.belongsTo(db.availabilities, {
  as: "availability",
  foreignKey: "availabilityId",
});

db.packageSessions.hasMany(db.availabilities, {
  as: "availability",
  foreignKey: "packageSessionId",
});
db.sequelize
  .sync({ force: false })
  .then(() => console.log(`Database synced`))
  .catch((err) => console.log(err));

db.packageSessions.hasMany(db.sessionBookings, {
  as: "sessionBooking",
  foreignKey: "packageSessionId",
});
db.sessionBookings.belongsTo(db.packageSessions, {
  as: "packageSession",
  foreignKey: "packageSessionId",
});
db.hosts.hasMany(db.invites, { as: "invites", foreignKey: "hostId" });
db.hosts.hasMany(db.sessionBookings, {
  as: "sessionBooking",
  foreignKey: "hostId",
});

db.sessionBookings.belongsTo(db.hosts, {
  as: "host",
  foreignKey: "hostId",
});
db.customers.hasMany(db.sessionBookings, {
  as: "sessionBooking",
  foreignKey: "customerId",
});
db.sessionBookings.belongsTo(db.customers, {
  as: "customer",
  foreignKey: "customerId",
});

db.hosts.hasMany(db.availabilities, {
  as: "availability",
  foreignKey: "hostId",
});
db.availabilities.belongsTo(db.hosts, {
  as: "host",
  foreignKey: "hostId",
});

db.hosts.hasMany(db.sessionVenues, {
  as: "sessionVenue",
  foreignKey: "hostId",
});
db.hosts.hasMany(db.DST, { as: "DST", foreignKey: "hostId" });
db.hosts.hasMany(db.commissions, { as: "commission", foreignKey: "hostId" });
db.customers.hasMany(db.commissions, {
  as: "commission",
  foreignKey: "customerId",
});
db.hosts.hasMany(db.withdrawals, { as: "withdrawal", foreignKey: "hostId" });
db.venues.hasMany(db.experiences, { as: "experience", foreignKey: "venueId" });
db.customers.hasMany(db.posts, { as: "post", foreignKey: "customerId" });
db.communities.hasMany(db.posts, { as: "post", foreignKey: "communityId" });
db.customers.hasMany(db.communityMemberships, {
  as: "communityMembership",
  foreignKey: "customerId",
});
db.communities.hasMany(db.communityMemberships, {
  as: "communityMembership",
  foreignKey: "communityId",
});
db.hosts.hasMany(db.communityMemberships, {
  as: "communityMembership",
  foreignKey: "hostId",
});

db.hosts.hasMany(db.monthlySubsRecord, {
  as: "monthlySubsRecord",
  foreignKey: "hostId",
});
db.hosts.hasOne(db.communities, { as: "post", foreignKey: "hostId" });
db.workshops.hasMany(db.workshopClasses, {
  foreignKey: "workshopId",
  as: "workshopClass",
});
db.workshopClasses.belongsTo(db.workshops, {
  foreignKey: "workshopId",
  as: "workshop",
});
db.hosts.hasOne(db.transferRecipient, {
  as: "transferRecipient",
  foreignKey: "hostId",
});
db.transferRecipient.belongsTo(db.hosts, { as: "host", foreignKey: "hostId" });
db.hosts.hasMany(db.classSessions, {
  foreignKey: "hostId",
  as: "classSession",
});
db.classSessions.belongsTo(db.hosts, { foreignKey: "hostId", as: "host" });

db.hosts.hasMany(db.experiences, {
  foreignKey: "hostId",
  as: "experience",
});
db.experiences.belongsTo(db.hosts, { foreignKey: "hostId", as: "host" });

db.hosts.hasMany(db.venues, {
  foreignKey: "hostId",
  as: "venue",
});

db.venues.belongsTo(db.hosts, { foreignKey: "hostId", as: "host" });

db.hosts.hasOne(db.wallets, { foreignKey: "hostId", as: "wallet" });
db.sessionVenues.hasMany(db.packageSessions, {
  foreignKey: "sessionVenueId",
  as: "sessionVenue",
});
db.wallets.belongsTo(db.hosts, { foreignKey: "hostId", as: "host" });

db.hosts.hasMany(db.workshops, {
  foreignKey: "hostId",
  as: "workshop",
});
db.workshops.belongsTo(db.hosts, { foreignKey: "hostId", as: "host" });

db.hosts.hasMany(db.packageClasses, {
  foreignKey: "hostId",
  as: "packageClass",
});
db.packageClasses.belongsTo(db.hosts, { foreignKey: "hostId", as: "host" });

db.packageClasses.hasMany(db.packageSessions, {
  foreignKey: "packageClassId",
  as: "packageSession",
});
db.packageSessions.belongsTo(db.packageClasses, {
  foreignKey: "packageClassId",
  as: "packageClass",
});

db.classSessions.hasMany(db.locations, {
  foreignKey: "classSessionId",
  as: "location",
});
db.locations.belongsTo(db.classSessions, {
  foreignKey: "classSessionId",
  as: "classSession",
});

db.classSessions.hasMany(db.ratings, {
  foreignKey: "classSessionId",
  as: "rating",
});
db.ratings.belongsTo(db.classSessions, {
  foreignKey: "classSessionId",
  as: "classSession",
});

db.hosts.hasMany(db.ratings, {
  foreignKey: "hostId",
  as: "ratings",
});

db.customers.hasMany(db.ratings, {
  foreignKey: "customerId",
  as: "rating",
});

db.experiences.hasMany(db.ratings, {
  foreignKey: "experienceId",
  as: "rating",
});
db.workshops.hasMany(db.ratings, {
  foreignKey: "workshopId",
  as: "rating",
});
db.packageClasses.hasMany(db.ratings, {
  foreignKey: "packageClassId",
  as: "rating",
});

db.experiences.hasMany(db.locations, {
  foreignKey: "experiencesId",
  as: "location",
});
db.locations.belongsTo(db.experiences, {
  foreignKey: "experiencesId",
  as: "experience",
});

db.workshops.hasMany(db.locations, {
  foreignKey: "workshopId",
  as: "location",
});
db.locations.belongsTo(db.workshops, {
  as: "workshop",
  foreignKey: "workshopId",
});

db.packageClasses.hasMany(db.locations, {
  foreignKey: "packageClassId",
  as: "location",
});
db.locations.belongsTo(db.packageClasses, {
  as: "packageClass",
  foreignKey: "packageClassId",
});

db.packageClasses.hasMany(db.packageTickets, {
  as: "packageTicket",
  foreignKey: "packageClassId",
});
db.packageTickets.belongsTo(db.packageClasses, {
  as: "packageClass",
  foreignKey: "packageClassId",
});

db.hosts.hasMany(db.payouts, { as: "payout", foreignKey: "hostId" });
db.payouts.belongsTo(db.hosts, { as: "host", foreignKey: "hostId" });

db.customers.hasMany(db.workshopTickets, {
  as: "workshopTicket",
  foreignKey: "customerId",
});
db.workshopTickets.belongsTo(db.customers, {
  as: "customer",
  foreignKey: "customerId",
});

db.guests.hasMany(db.packageTickets, {
  as: "packageTicket",
  foreignKey: "guestId",
});
db.packageTickets.belongsTo(db.guests, {
  as: "guest",
  foreignKey: "guestId",
});

db.guests.hasMany(db.experienceTickets, {
  as: "experience",
  foreignKey: "guestId",
});
db.experienceTickets.belongsTo(db.guests, {
  as: "guest",
  foreignKey: "guestId",
});

db.guests.hasMany(db.workshopTickets, {
  as: "workshopTicket",
  foreignKey: "guestId",
});
db.workshopTickets.belongsTo(db.guests, {
  as: "guest",
  foreignKey: "guestId",
});

db.guests.hasMany(db.classTickets, {
  as: "classTicket",
  foreignKey: "guestId",
});

db.customers.hasMany(db.waitlists, {
  as: "waitlist",
  foreignKey: "customerId",
});
db.classTickets.belongsTo(db.guests, {
  as: "guest",
  foreignKey: "guestId",
});

db.hosts.hasMany(db.notifications, {
  as: "notification",
  foreignKey: "hostId",
});
db.notifications.belongsTo(db.hosts, { as: "host", foreignKey: "hostId" });

db.customers.hasMany(db.notifications, {
  as: "notification",
  foreignKey: "customerId",
});
db.notifications.belongsTo(db.customers, {
  as: "customer",
  foreignKey: "customerId",
});

db.hosts.hasMany(db.reviewComments, {
  as: "reviewComment",
  foreignKey: "hostId",
});
db.reviewComments.belongsTo(db.hosts, { as: "host", foreignKey: "hostId" });

db.customers.hasMany(db.paymentTransactions, {
  as: "paymentTransaction",
  foreignKey: "customerId",
});
db.paymentTransactions.belongsTo(db.customers, {
  as: "customer",
  foreignKey: "customerId",
});

db.guests.hasMany(db.paymentTransactions, {
  as: "paymentTransaction",
  foreignKey: "guestId",
});
db.paymentTransactions.belongsTo(db.guests, {
  as: "guest",
  foreignKey: "guestId",
});

db.paymentTransactions.hasMany(db.classTickets, {
  as: "ClassTicket",
  foreignKey: "paymentTransactionId",
});
db.classTickets.belongsTo(db.paymentTransactions, {
  as: "paymentTransaction",
  foreignKey: "paymentTransactionId",
});

db.paymentTransactions.hasOne(db.packageTickets, {
  as: "packageTicket",
  foreignKey: "paymentTransactionId",
});
db.packageTickets.belongsTo(db.paymentTransactions, {
  as: "paymentTransaction",
  foreignKey: "paymentTransactionId",
});

db.hosts.hasOne(db.hostPlans, {
  as: "hostPlan",
  foreignKey: "hostId",
});
db.hostPlans.belongsTo(db.hosts, {
  as: "host",
  foreignKey: "hostId",
});

db.classSessions.hasMany(db.waitlists, {
  as: "waitlist",
  foreignKey: "classSessionId",
});
db.waitlists.belongsTo(db.classSessions, {
  as: "classSession",
  foreignKey: "classSessionId",
});

db.experiences.hasMany(db.waitlists, {
  as: "waitlist",
  foreignKey: "experienceId",
});
db.waitlists.belongsTo(db.experiences, {
  as: "experience",
  foreignKey: "experienceId",
});

db.workshops.hasMany(db.waitlists, {
  as: "waitlist",
  foreignKey: "workshopId",
});
db.waitlists.belongsTo(db.workshops, {
  as: "workshop",
  foreignKey: "workshopId",
});

db.packageClasses.hasMany(db.waitlists, {
  as: "waitlist",
  foreignKey: "packageClassId",
});
db.waitlists.belongsTo(db.packageClasses, {
  as: "packageClass",
  foreignKey: "packageClassId",
});

db.hosts.hasMany(db.documents, { as: "document", foreignKey: "hostId" });
db.documents.belongsTo(db.hosts, { as: "host", foreignKey: "hostId" });

db.categories.hasMany(db.subCategories, {
  as: "subCategory",
  foreignKey: "categoryId",
});
db.subCategories.belongsTo(db.categories, {
  as: "category",
  foreignKey: "categoryId",
});

db.customers.hasMany(db.wishlists, {
  as: "wishlist",
  foreignKey: "customerId",
});
db.wishlists.belongsTo(db.customers, {
  as: "customer",
  foreignKey: "customerId",
});
db.customers.hasMany(db.carts, { as: "cart", foreignKey: "customerId" });
db.carts.belongsTo(db.customers, { as: "customer", foreignKey: "customerId" });

db.customers.hasMany(db.hostReviews, {
  as: "hostReview",
  foreignKey: "customerId",
});
db.hostReviews.belongsTo(db.customers, {
  as: "customer-hostReviews",
  foreignKey: "customerId",
});

db.hosts.hasMany(db.hostReviews, {
  as: "hostReview",
  foreignKey: "hostId",
});
db.hostReviews.belongsTo(db.hosts, {
  as: "customer",
  foreignKey: "hostId",
});

db.classSessions.hasOne(db.wishlists, {
  as: "wishlist",
  foreignKey: "classSessionId",
});
db.wishlists.belongsTo(db.classSessions, {
  as: "classSession",
  foreignKey: "classSessionId",
});

db.workshops.hasOne(db.wishlists, {
  as: "wishlist",
  foreignKey: "workshopId",
});
db.wishlists.belongsTo(db.workshops, {
  as: "workshop",
  foreignKey: "workshopId",
});

db.packageClasses.hasOne(db.wishlists, {
  as: "wishlist",
  foreignKey: "packageClassId",
});
db.wishlists.belongsTo(db.packageClasses, {
  as: "packageClass",
  foreignKey: "packageClassId",
});

db.classSessions.hasOne(db.carts, { as: "cart", foreignKey: "classSessionId" });
db.carts.belongsTo(db.classSessions, {
  as: "classSession",
  foreignKey: "classSessionId",
});

db.experiences.hasOne(db.carts, { as: "cart", foreignKey: "experienceId" });
db.carts.belongsTo(db.experiences, {
  as: "experience",
  foreignKey: "experienceId",
});

db.workshops.hasOne(db.carts, { as: "cart", foreignKey: "workshopId" });
db.carts.belongsTo(db.workshops, {
  as: "workshop",
  foreignKey: "workshopId",
});

db.packageClasses.hasOne(db.carts, {
  as: "cart",
  foreignKey: "packageClassId",
});
db.carts.belongsTo(db.packageClasses, {
  as: "packageClass",
  foreignKey: "packageClassId",
});

db.classSessions.hasMany(db.classTickets, {
  as: "ClassTicket",
  foreignKey: "classSessionId",
});
db.classTickets.belongsTo(db.classSessions, {
  as: "classSession",
  foreignKey: "sessionClassId",
});

db.experiences.hasMany(db.experienceTickets, {
  as: "experienceTicket",
  foreignKey: "experienceId",
});
db.experienceTickets.belongsTo(db.experiences, {
  as: "experience",
  foreignKey: "experienceId",
});

db.workshops.hasMany(db.workshopTickets, {
  as: "workshopTicket",
  foreignKey: "workshopId",
});
db.workshopTickets.belongsTo(db.workshops, {
  as: "workshop",
  foreignKey: "workshopId",
});

db.packageSessions.hasMany(db.packageTickets, {
  as: "packageTicket",
  foreignKey: "sessionId",
});
db.packageTickets.belongsTo(db.packageSessions, {
  as: "packageSession",
  foreignKey: "sessionId",
});

db.packageSessions.hasMany(db.comments, {
  as: "comment",
  foreignKey: "packageSessionId",
});
db.comments.belongsTo(db.packageSessions, {
  as: "packageSession",
  foreignKey: "packageSessionId",
});

db.packageClasses.hasMany(db.comments, {
  as: "comment",
  foreignKey: "packageClassId",
});
db.comments.belongsTo(db.packageClasses, {
  as: "packageClass",
  foreignKey: "packageClassId",
});

db.workshops.hasMany(db.comments, {
  as: "comment",
  foreignKey: "workshopId",
});
db.comments.belongsTo(db.workshops, {
  as: "workshop",
  foreignKey: "workshopId",
});

db.workshopClasses.hasMany(db.comments, {
  as: "comment",
  foreignKey: "workshopClassId",
});
db.comments.belongsTo(db.workshopClasses, {
  as: "workshopClass",
  foreignKey: "workshopClassId",
});

db.classSessions.hasMany(db.comments, {
  as: "comment",
  foreignKey: "classSessionId",
});
db.comments.belongsTo(db.classSessions, {
  as: "classSession",
  foreignKey: "classSessionId",
});

db.experiences.hasMany(db.comments, {
  as: "comment",
  foreignKey: "experienceId",
});
db.comments.belongsTo(db.experiences, {
  as: "experience",
  foreignKey: "experienceId",
});

db.hosts.hasMany(db.packageSessions, {
  as: "packageSession",
  foreignKey: "hostId",
});
db.packageSessions.belongsTo(db.hosts, { as: "host", foreignKey: "hostId" });

db.hosts.hasMany(db.workshopClasses, {
  as: "workshopClass",
  foreignKey: "hostId",
});
db.workshopClasses.belongsTo(db.hosts, { as: "host", foreignKey: "hostId" });

db.customers.hasMany(db.comments, {
  as: "comment",
  foreignKey: "customerId",
});
db.comments.belongsTo(db.customers, {
  as: "customer",
  foreignKey: "customerId",
});
db.hosts.hasMany(db.staffs, { as: "staff", foreignKey: "hostId" });
db.staffs.belongsToMany(db.hosts, { through: "invite" });

db.hosts.hasMany(db.classTemplates, {
  as: "classTemplate",
  foreignKey: "hostId",
});
db.classTemplates.belongsTo(db.hosts, { as: "host", foreignKey: "hostId" });

db.staffs.belongsToMany(db.classTemplates, { through: "HostClassTemplate" });
db.classTemplates.belongsToMany(db.staffs, { through: "HostClassTemplate" });

db.workshops.hasMany(db.staffPermissions, {
  as: "staffPermission",
  foreignKey: "workshopId",
});
db.staffPermissions.belongsTo(db.workshops, {
  as: "workshop",
  foreignKey: "workshopId",
});

db.packageClasses.hasMany(db.staffPermissions, {
  as: "staffPermission",
  foreignKey: "packageClassId",
});

db.staffPermissions.belongsTo(db.packageClasses, {
  as: "packageClass",
  foreignKey: "packageClassId",
});

db.classSessions.hasMany(db.staffPermissions, {
  as: "staffPermission",
  foreignKey: "classSessionId",
});

db.staffPermissions.belongsTo(db.classSessions, {
  as: "classSession",
  foreignKey: "classSessionId",
});

db.experiences.hasMany(db.staffPermissions, {
  as: "staffPermission",
  foreignKey: "experienceId",
});

db.staffPermissions.belongsTo(db.experiences, {
  as: "experience",
  foreignKey: "experienceId",
});

db.hosts.hasMany(db.staffPermissions, {
  as: "staffPermission",
  foreignKey: "hostId",
});

db.staffPermissions.belongsTo(db.hosts, {
  as: "host",
  foreignKey: "hostId",
});

db.staffs.hasMany(db.staffPermissions, {
  as: "staffPermission",
  foreignKey: "staffId",
});

db.staffPermissions.belongsTo(db.staffs, {
  as: "staff",
  foreignKey: "staffId",
});

db.staffs.hasMany(db.acceptInvites, {
  as: "acceptInvite",
  foreignKey: "staffId",
});

db.acceptInvites.belongsTo(db.staffs, {
  as: "staff",
  foreignKey: "staffId",
});

db.hosts.hasMany(db.acceptInvites, {
  as: "acceptInvite",
  foreignKey: "hostId",
});

db.acceptInvites.belongsTo(db.hosts, {
  as: "host",
  foreignKey: "hostId",
});

db.workshops.hasMany(db.acceptInvites, {
  as: "acceptInvite",
  foreignKey: "workshopId",
});
db.acceptInvites.belongsTo(db.workshops, {
  as: "workshop",
  foreignKey: "workshopId",
});

db.packageClasses.hasMany(db.acceptInvites, {
  as: "acceptInvite",
  foreignKey: "packageClassId",
});

db.acceptInvites.belongsTo(db.packageClasses, {
  as: "packageClass",
  foreignKey: "packageClassId",
});

db.classSessions.hasMany(db.acceptInvites, {
  as: "acceptInvite",
  foreignKey: "classSessionId",
});

db.acceptInvites.belongsTo(db.classSessions, {
  as: "classSession",
  foreignKey: "classSessionId",
});

db.experiences.hasMany(db.acceptInvites, {
  as: "acceptInvite",
  foreignKey: "experienceId",
});

db.acceptInvites.belongsTo(db.experiences, {
  as: "experience",
  foreignKey: "experienceId",
});

db.hostPlans.hasMany(db.hostPaymentPlanTransactions, {
  as: "hostPaymentPlanTransaction",
  foreignKey: "hostPlanId",
});
db.hostPaymentPlanTransactions.belongsTo(db.hostPlans, {
  as: "hostPlan",
  foreignKey: "hostPlanId",
});
db.hosts.hasMany(db.hostPaymentPlanTransactions, {
  as: "hostPaymentPlanTransaction",
  foreignKey: "hostId",
});
db.hostPaymentPlanTransactions.belongsTo(db.hosts, {
  as: "host",
  foreignKey: "hostId",
});

db.hosts.hasMany(db.cancelTickets, {
  as: "cancelTicket",
  foreignKey: "hostId",
});
db.classTickets.belongsTo(db.hosts, { as: "host", foreignKey: "hostId" });

db.customers.hasMany(db.cancelTickets, {
  as: "cancelTicket",
  foreignKey: "customerId",
});
db.classTickets.belongsTo(db.customers, {
  as: "customer",
  foreignKey: "customerId",
});

db.workshopClasses.hasMany(db.cancelTickets, {
  as: "cancelTicket",
  foreignKey: "workshopClassId",
});
// db.classTickets.belongsTo(db.workshopClasses, {
//   as: "workshopClass",
//   foreignKey: "workshopClassId",
// });

db.workshops.hasMany(db.cancelTickets, {
  as: "cancelTicket",
  foreignKey: "workshopId",
});

db.packageSessions.hasMany(db.cancelTickets, {
  as: "cancelTicket",
  foreignKey: "packageSessionId",
});

db.classSessions.hasMany(db.cancelTickets, {
  as: "cancelTicket",
  foreignKey: "classSessionId",
});

db.experiences.hasMany(db.cancelTickets, {
  as: "cancelTicket",
  foreignKey: "experienceId",
});

db.packageClasses.hasMany(db.cancelTickets, {
  as: "cancelTicket",
  foreignKey: "packageClassId",
});
db.classTickets.belongsTo(db.packageClasses, {
  as: "packageClass",
  foreignKey: "packageClassId",
});
db.hosts.hasMany(db.workshopTickets, {
  as: "workshopticket",
  foreignKey: "hostId",
});
db.workshopTickets.belongsTo(db.hosts, { as: "host", foreignKey: "hostId" });
db.customers.hasMany(db.packageTickets, {
  as: "packageTicket",
  foreignKey: "customerId",
});
db.packageTickets.belongsTo(db.customers, {
  as: "customer",
  foreignKey: "customerId",
});

db.customers.hasMany(db.experienceTickets, {
  as: "experienceTicket",
  foreignKey: "customerId",
});
db.experienceTickets.belongsTo(db.customers, {
  as: "customer",
  foreignKey: "customerId",
});
db.hosts.hasMany(db.packageTickets, {
  as: "packageTicket",
  foreignKey: "hostId",
});
db.hosts.hasMany(db.experienceTickets, {
  as: "experienceTicket",
  foreignKey: "hostId",
});
db.rooms.hasMany(db.messages, { as: "message", foreignKey: "roomId" });
db.messages.belongsTo(db.rooms, { as: "room", foreignKey: "roomId" });
db.customers.hasMany(db.messages, { as: "message", foreignKey: "customerId" });
db.messages.belongsTo(db.customers, {
  as: "customer",
  foreignKey: "customerId",
});
db.classSessions.hasMany(db.rooms, { as: "room", foreignKey: "classId" });
db.workshops.hasMany(db.rooms, { as: "room", foreignKey: "workshopId" });
db.experiences.hasMany(db.rooms, { as: "room", foreignKey: "experienceId" });
db.packageClasses.hasMany(db.rooms, {
  as: "room",
  foreignKey: "packageClassId",
});

db.hosts.hasMany(db.freeClassSessions, {
  as: "freeClassSession",
  foreignKey: "hostId",
});
db.hosts.hasMany(db.freeExperiences, {
  as: "freeExperience",
  foreignKey: "hostId",
});
db.hosts.hasMany(db.freePackageClasses, {
  as: "freePackageClass",
  foreignKey: "hostId",
});

db.hosts.hasMany(db.freeworkshops, {
  as: "freeworkshop",
  foreignKey: "hostId",
});

module.exports = db;
