const Review = require("../models/review.js"); // Review model 
const Listing = require("../models/listing.js"); //Listing model require

module.exports.createReview = async (req,res,next)=>{
    // console.log(req.params.id);
    let {id}=req.params; // here this id is listing ki id 
    let listing = await Listing.findById(id);
    let newReview=new Review(req.body.review); // jo apno ne review form m review[rating], review[comment] bnaya na vo aayga body m
    newReview.author=req.user._id;
    listing.reviews.push(newReview);

    await newReview.save();
    await listing.save();

    // console.log("new review saved");
    // res.send("new review saved");
    req.flash("success","New Review Created!");

    res.redirect(`/listings/${listing._id}`);

}


module.exports.destroyReview = async (req,res,next)=>{
    let {id,reviewId}=req.params;
    await Listing.findByIdAndUpdate(id,{$pull:{reviews:reviewId}});
    await Review.findByIdAndDelete(reviewId);
    req.flash("success","Review Deleted");
    res.redirect(`/listings/${id}`);

}