const express=require("express");
const router=express.Router();
const wrapAsync=require("../utils/wrapAsync.js");
const ExpressError=require("../utils/ExpressError.js");
const {listingSchema}=require("../schema.js");
const Listing=require("../models/listing.js");



const validateListing=(req,res,next)=>{
    let {error}=listingSchema.validate(req.body);
    if(error){
      let errMsg=error.details.map((el)=>el.message).join(",");
      throw new ExpressError(400,errMsg);
    }else{
      next();
    }
  };

  
//index route
router.get("/",wrapAsync(async(req,res)=>{
    const allListings=await Listing.find({});
    res.render("listings/index.ejs",{allListings});
  }));
  
  //new route
  router.get("/new",(req,res)=>{
    res.render("listings/new.ejs");
  });
  
  //show route
  router.get("/:id",wrapAsync(async(req,res)=>{
    let{id}= req.params;
    const listing=await Listing.findById(id).populate("reviews");
    
    res.render("listings/show.ejs",{listing});
  }));

  //create route
router.post("/",validateListing,wrapAsync(async(req,res,next)=>{
  
    const newListing= new Listing(req.body.listing);
    
  await newListing.save();
  res.redirect("/listings");
  
})
);

//EDIT ROUTE
router.get("/:id/edit",wrapAsync(async(req,res)=>{
  let{id}= req.params;
  const listing=await Listing.findById(id);
  console.log(listing.description);
  res.render("listings/edit.ejs",{listing});
}));

//UPDATE ROUTE
router.put("/:id", validateListing, wrapAsync(async (req, res) => {
  
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
router.delete("/:id",wrapAsync(async(req,res)=>{
    let {id}=req.params;
    let deletedListing=await Listing.findByIdAndDelete(id);
    res.redirect("/listings");
  }));

module.exports=router;