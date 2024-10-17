const express=require("express");
const app=express();
const mongoose=require("mongoose");
const Listing=require("./models/listing.js");
const path=require("path");
const methodOverride=require("method-override");
const ejsMate=require("ejs-mate");
const wrapAsync=require("./utils/wrapAsync.js");
const ExpressError=require("./utils/ExpressError.js");
const {listingSchema,reviewSchema}=require("./schema.js");
const Review=require("./models/review.js");

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


const validateListing=(req,res,next)=>{
  let {error}=listingSchema.validate(req.body);
  if(error){
    let errMsg=error.details.map((el)=>el.message).join(",");
    throw new ExpressError(400,errMsg);
  }else{
    next();
  }
};


const validateReview=(req,res,next)=>{
  let {error}=reviewSchema.validate(req.body);
  
  if(error){
    let errMsg=error.details.map((el)=>el.message).join(",");
    throw new ExpressError(400,errMsg);
  }else{
    next();
  }
};

//index route
app.get("/listings",wrapAsync(async(req,res)=>{
  const allListings=await Listing.find({});
  res.render("listings/index.ejs",{allListings});
}));

//new route
app.get("/listings/new",(req,res)=>{
  res.render("listings/new.ejs");
});

//show route
app.get("/listings/:id",wrapAsync(async(req,res)=>{
  let{id}= req.params;
  const listing=await Listing.findById(id).populate("reviews");
  
  res.render("listings/show.ejs",{listing});
}));

//create route
app.post("/listings",validateListing,wrapAsync(async(req,res,next)=>{
  
    const newListing= new Listing(req.body.listing);
    
  await newListing.save();
  res.redirect("/listings");
  
})
);

//EDIT ROUTE
app.get("/listings/:id/edit",wrapAsync(async(req,res)=>{
  let{id}= req.params;
  const listing=await Listing.findById(id);
  console.log(listing.description);
  res.render("listings/edit.ejs",{listing});
}));


//UPDATE route

// app.put("/listings/:id",async(req,res)=>{
//   let {id}=req.params;
//   console.log(req.body.listing.image);
//   await Listing.findByIdAndUpdate(id, {...req.body.listing}, {new: true});
//   res.redirect(`/listings/${id}`);
// })

// app.put("/listings/:id",validateListing, wrapAsync(async (req, res) => {
  
//   let { id } = req.params;
//   const { listing } = req.body;

//   console.log("Request body:", listing.image); 
//     const updateData = {
//       title: listing.title,
//       description: listing.description,
//       "image.url": listing.image?.url,         
//       "image.filename": listing.image?.filename, 
//       price: listing.price,
//       location: listing.location,
//       country: listing.country
//     };
//     await Listing.findByIdAndUpdate(id, updateData);
//   res.redirect(`/listings/${id}`);
// }));


app.put("/listings/:id", validateListing, wrapAsync(async (req, res) => {
  
  // Extract the listing ID from the request parameters
  const { id } = req.params;

  // Extract the listing object from the request body
  const { listing } = req.body;

  // Debugging: Log the image object if it exists
  

  // Prepare the data to update, including optional nested fields (e.g., image)
  const updateData = {
    title: listing.title,
    description: listing.description,
    "image.url": listing.image?.url,         // Optional chaining to avoid errors if image doesn't exist
    "image.filename": listing.image?.filename,
    price: listing.price,
    location: listing.location,
    country: listing.country
  };

  try {
    // Find the listing by ID and update it with the new data
    const updatedListing = await Listing.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    // If the listing is not found, send a 404 response
    if (!updatedListing) {
      return res.status(404).send("Listing not found");
    }

    // Redirect to the updated listing page
    res.redirect(`/listings/${id}`);

  } catch (error) {
    // Handle any errors during the update process
    console.error("Error updating listing:", error);
    return res.status(500).send("Error updating listing");
  }
}));





//DELETE ROUTE
app.delete("/listings/:id",wrapAsync(async(req,res)=>{
  let {id}=req.params;
  let deletedListing=await Listing.findByIdAndDelete(id);
  res.redirect("/listings");
}));


//reviews

app.post("/listings/:id/reviews", validateReview, wrapAsync(async (req, res) => {
  // Case 1: Listing is not found
  let listing = await Listing.findById(req.params.id);
  if (!listing) {
    // Return 404 error if the listing doesn't exist
    return res.status(404).send("Listing not found");
  }

  // Case 2: Review data from request body is invalid (Handled by validateReview middleware)
  // If validation fails, the validateReview middleware should stop execution and send an error response.

  // Case 3: Creating a new review
  let newReview = new Review(req.body.review);
  //console.log(newReview);  // Log the review for debugging

  // Adding the review to the listing's reviews array
  listing.reviews.push(newReview);

  // Case 4: Saving the new review to the database
  try {
    await newReview.save(); // Saving the review
  } catch (err) {
    // Handle any errors that occur while saving the review
    console.error("Error saving review:", err);
    return res.status(500).send("Error saving review.");
  }

  // Case 5: Saving the updated listing to the database
  try {
    await listing.save(); // Saving the updated listing with the new review
  } catch (err) {
    // Handle errors that occur while saving the listing
    console.error("Error saving listing:", err);
    // Rollback: delete the saved review if the listing couldn't be updated
    await Review.findByIdAndDelete(newReview._id);
    return res.status(500).send("Error saving listing. Review has been discarded.");
  }

  // Case 6: Success - Redirect to the listing's detail page
  res.redirect(`/listings/${listing._id}`);
}));





// app.post("/listings/:id/reviews",validateReview,wrapAsync( async(res,req)=>{
//   let listing=await Listing.findById(req.params.id);
//   let newReview=new Review(req.body.review);
//   console.log(newReview);
//   listing.reviews.push(newReview);

//   await newReview.save();
//   await listing.save();
  
//   res.redirect(`/listing/${listing._id}`);
// }));

// app.get("/testlisting",async(req,res)=>{
// let samplelisting=new Listing({
//     title:"my nrew villa",
//     description: "byu beach",
//     price:1200,
//     location:"calangura,goa",
//     country:"india",
// });
// await samplelisting.save();
// console.log("sample arae saved");
// res.send("susscefull testing");
// });
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