const Listing=require("../models/listing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken=process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken});

module.exports.index= async (req, res,next) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });

}

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
}

module.exports.showListing = async (req, res,next) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
    .populate({path:"reviews",populate:{path:"author"},})
    .populate("owner"); // populate() isliye use kiya kyunki apne pass reviews ki objectid h array ki form m and apne chahte ki sirf id na jaye pura ka pura data jaye
    if(!listing){
        req.flash("error","Listing Deleted or Does not exist");
        res.redirect("/listings");
    }
    else{
        res.render("listings/show.ejs", { listing });
    }
}


module.exports.createListing = async (req, res,next) => {
    let response=await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1
      })
        .send()
    let url=req.file.path;
    let filename=req.file.filename;
    const newListing = new Listing(req.body.listing);
    newListing.owner=req.user._id;
    newListing.image={filename,url};
    newListing.geometry=response.body.features[0].geometry; // this response.body.features[0].geometry; value is coming from mapbox 
    await newListing.save();
    req.flash("success","New Listing Created!");
    res.redirect("/listings");

}


module.exports.renderEditForm = async (req, res,next) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        req.flash("error","Listing Deleted or Does not exist");
        res.redirect("/listings");
    }
        let originalImageUrl=listing.image.url;
        originalImageUrl= originalImageUrl.replace("/upload","/upload/w_250") // image quality thodi kmm kre edit page pr vha high quality dikha kr ky krna 
        res.render("listings/edit.ejs", { listing, originalImageUrl });
    
}

module.exports.updateListing = async (req, res,next) => {

    let { id } = req.params;
    let listing=await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    if(typeof req.file!=="undefined"){
        let url=req.file.path;
        let filename=req.file.filename;
        listing.image={filename,url};
        await listing.save();
    }

    req.flash("success","Listing Updated!");
    res.redirect(`/listings/${id}`);

}


module.exports.destroyListing = async (req, res,next) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success","Listing Deleted!");
    res.redirect("/listings");
}