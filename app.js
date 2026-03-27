// ── Must be first: catch DB connection rejections during cold start ───────────
// connect-mongo and mongoose emit unhandledRejections when Atlas is unreachable
// on Vercel's cold start. This prevents the serverless function from crashing.
// The actual error is handled gracefully per-request in the DB middleware below.
process.on('unhandledRejection', (reason) => {
    console.warn('Unhandled rejection (handled gracefully):', reason && reason.message);
});

if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const userRouter = require("./routes/user.js");

const dbUrl = process.env.ATLASDB_URL;

// ── DB connection — lazy, shared with MongoStore via clientPromise ────────────
let resolveClient, rejectClient;
const clientPromise = new Promise((res, rej) => {
    resolveClient = res;
    rejectClient = rej;
});

mongoose.connect(dbUrl, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
}).then(m => {
    console.log("connected to database");
    resolveClient(m.connection.getClient());
}).catch(err => {
    console.error("DB connection failed:", err.message);
    rejectClient(err);
});

// ── Express config ────────────────────────────────────────────────────────────
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "public")));

// ── Session — MongoStore shares the mongoose clientPromise ────────────────────
const store = MongoStore.create({
    clientPromise,
    crypto: { secret: process.env.SECRET },
    touchAfter: 24 * 60 * 60,
    autoRemove: "native",
});
store.on("error", (err) => console.error("Session store error:", err.message));

app.use(session({
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true }
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.failure = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// ── Root redirect (no DB needed) ──────────────────────────────────────────────
app.get("/", (req, res) => res.redirect("/listings"));

// ── DB readiness gate — runs before every data route ─────────────────────────
app.use(async (req, res, next) => {
    if (mongoose.connection.readyState === 1) return next();
    try {
        await clientPromise;
        next();
    } catch (err) {
        next(new ExpressError(500, "Database unavailable. Please try again in a moment."));
    }
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// ── 404 & global error handler ────────────────────────────────────────────────
app.all(/(.*)/, (req, res, next) => {
    next(new ExpressError(404, "Page not found"));
});

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong!" } = err;
    res.status(statusCode).render("listings/error.ejs", { message });
});

// ── Local dev only ────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
    app.listen(8080, () => console.log("server is listening to port 8080"));
}

module.exports = app;
