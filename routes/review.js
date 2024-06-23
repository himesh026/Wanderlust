const express=require("express");
const router=express.Router({mergeParams:true});

const wrapAsync = require("../utils/wrapAsync.js"); // to handle async error

const Review = require("../models/review.js"); // Review model 
const Listing = require("../models/listing.js"); //Listing model require

const {validateReview,isLoggedIn,isReviewAuthor}=require("../middleware.js");

const reviewController=require("../controllers/reviews.js");

//for review creating a route

router.post("/",isLoggedIn,validateReview,wrapAsync( reviewController.createReview ));

//for deleting reviews, delete review route

router.delete("/:reviewId",isLoggedIn,isReviewAuthor,wrapAsync(reviewController.destroyReview));


module.exports=router;