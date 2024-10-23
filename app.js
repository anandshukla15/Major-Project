const express=require("express");
const app=express();
const mongoose=require("mongoose");

const path=require("path");
const methodOverride=require("method-override");
const ejsMate=require("ejs-mate");

const ExpressError=require("./utils/ExpressError.js");
const session=require("express-session");
// const passport=require("passport");
// const localStrategy=require("passport-local");
// const User=require("./models/user.js");


const listings=require("./routes/listing.js");
const reviews=require("./routes/review.js");

const MONGO_URL="mongodb://127.0.0.1:27017/wanderlust";

main()
  .then(()=>{
    console.log("connected to db");
  })
  .catch((err)=>{
    console.log(err);
  });

  async function main() {
    await mongoose.connect(MONGO_URL);
  }
  app.set("view engine","ejs");
  app.set("views",path.join(__dirname,"views"));
  app.use(express.urlencoded({extended:true}));
  app.use(methodOverride("_method"));
  app.engine('ejs',ejsMate);
  app.use(express.static(path.join(__dirname,"/public")));

app.get("/",(req,res)=>{
    res.send("hi ,i am robot");
});



// app.use(session(sessionOptions));


app.use("/listings",listings);

app.use("/listings/:id/reviews",reviews);





app.all("*",(re,res,next)=>{
  next(new ExpressError(404,"page not found"));
})

app.use((err,req,res,next)=>{
  let{statuscode=500,message="something went wrong"}=err;
  res.status(statuscode).render("error.ejs",{message});
// res.send("something went wrong");

});

app.listen(8080,()=>{
    console.log("server connected");
});