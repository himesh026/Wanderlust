const mongoose=require("mongoose");

const initData=require("./data.js");

const Listing=require("../models/listing.js");

const mongo_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
    .then(() => {
        console.log("connected to database");
    })
    .catch(err => console.log(err));

async function main() {
    await mongoose.connect(mongo_URL);

}

const initDB= async ()=>{
    await Listing.deleteMany({});
    initData.data=initData.data.map((obj)=>({...obj,owner:'667111f0f935f81baec1796e'}))
    await Listing.insertMany(initData.data); // initData ek object h 
    console.log("data was initiallized");

}

initDB();

