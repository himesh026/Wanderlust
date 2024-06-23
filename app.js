if(process.env.NODE_ENV!="production"){
    require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session=require("express-session");
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const listingRouter=require("./routes/listing.js");
const reviewRouter=require("./routes/review.js");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user.js");

const dbUrl=process.env.ATLASDB_URL;
const userRouter=require("./routes/user.js");


main()
    .then(() => {
        console.log("connected to database");
    })
    .catch(err => console.log(err));

async function main() {
    await mongoose.connect(dbUrl);

}
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public"))); // to use stattic files like css 

const store=MongoStore.create({
    mongoUrl:dbUrl,
    crypto:{
         secret:process.env.SECRET,
    },
    touchAfter: 24*60*60,
});

store.on("error",()=>{
    console.log("error in mongo session store",err);
})

const sessionOptions={
    store, // this is our mongo store ab apne session ki ingo apne atlas databse m store hogi
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires: Date.now() + 7*24*60*60*1000,
        maxAge:7*24*60*60*1000,
        httpOnly:true,
    }

};

// app.get("/", (req, res) => {
//     res.send("hi i am working");
// })


app.use(session(sessionOptions));
app.use(flash());
 
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// app.get("/demouser" , async (req,res)=>{
//     let fakeUser=new User({
//         email:"student@gmail.com",
//         username:"kaliya",
//     })

//    let registeredUser= await User.register(fakeUser, "helloworld");

//    res.send(registeredUser);
// })

app.use((req,res,next)=>{
    res.locals.success=req.flash("success"); // here we create a success in res locals , than apno ne flash ki success ki se agr koi message aata h to usme daal diya
    res.locals.failure=req.flash("error"); // error key se jo flash h use access kiya
    res.locals.currUser=req.user;
    next();
})

app.use("/listings",listingRouter); // here we our listing router

app.use("/listings/:id/reviews",reviewRouter); // here we define our review router

app.use("/",userRouter);



app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page not found"));
})
app.use((err, req, res, next) => {
    let { statusCode=400, message } = err;
    // res.status(statusCode).send(message);
    res.status(statusCode).render("listings/error.ejs",{message});
})

app.listen(8080, () => {
    console.log("server is listening to port 8080");
})