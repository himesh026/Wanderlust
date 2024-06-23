const mongoose=require("mongoose");

const Schema=mongoose.Schema;
const Review = require("./review.js");
const User = require("./user.js");


const listingSchema= new Schema({
    title:{
        type:String,
        required:true,
    },
    description:{
        type:String,
    },
    image: {
        filename:{
            type:String,
            default:"default-image"
        },
        url:{
            type:String,
            default:"https://www.bhg.com/thmb/H9VV9JNnKl-H1faFXnPlQfNprYw=/1799x0/filters:no_upscale():strip_icc()/white-modern-house-curved-patio-archway-c0a4a3b3-aa51b24d14d0464ea15d36e05aa85ac9.jpg",
        }
        
      },

    price:{
        type:Number,
    },
    location:{
        type:String,
    },
    country:{
        type:String,
    },
    reviews:[
        {
            type:Schema.Types.ObjectId,
            ref:"Review",  // ek listing k kyi sare review ho skte h to apno ne one to many ka case liya Review model k sath link krdiya
        }
    ],
    owner: {
        type:Schema.Types.ObjectId,
        ref:"User",
    },
    geometry: {
        type: {
          type: String, 
          enum: ['Point'], // 'location.type' must be 'Point'
          required: true
        },
        coordinates: {
          type: [Number],
          required: true
        }
      }


})
// defining post run middleware , if we delete a listing than all data related to it also delete including reviews

listingSchema.post("findOneAndDelete", async (listing)=>{
    if(listing){
        await Review.deleteMany({_id:{$in:listing.reviews}});
    }
})

const Listing=mongoose.model("Listing",listingSchema); // DB m listings naam ka collection banega

module.exports=Listing;



    // image:{
    //     type:String,
    //     default:"https://www.bhg.com/thmb/H9VV9JNnKl-H1faFXnPlQfNprYw=/1799x0/filters:no_upscale():strip_icc()/white-modern-house-curved-patio-archway-c0a4a3b3-aa51b24d14d0464ea15d36e05aa85ac9.jpg",
    //     set: (v)=> v===""? "https://www.bhg.com/thmb/H9VV9JNnKl-H1faFXnPlQfNprYw=/1799x0/filters:no_upscale():strip_icc()/white-modern-house-curved-patio-archway-c0a4a3b3-aa51b24d14d0464ea15d36e05aa85ac9.jpg" :v,
    // },