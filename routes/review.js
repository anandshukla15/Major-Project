const express=require("express");
const router=express.Router({mergeParams:true});
const wrapAsync=require("../utils/wrapAsync.js");
const ExpressError=require("../utils/ExpressError.js");
const {reviewSchema}=require("../schema.js");
const Review=require("../models/review.js");
const Listing=require("../models/listing.js");

const validateReview=(req,res,next)=>{
    let {error}=reviewSchema.validate(req.body);
    
    if(error){
      let errMsg=error.details.map((el)=>el.message).join(",");
      throw new ExpressError(400,errMsg);
    }else{
      next();
    }
  };

//reviews

router.post("/", validateReview, wrapAsync(async (req, res) => {
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
      await listing.save();
       // Saving the updated listing with the new review
    } catch (err) {
      // Handle errors that occur while saving the listing
      console.error("Error saving listing:", err);
      // Rollback: delete the saved review if the listing couldn't be updated
      await Review.findByIdAndDelete(newReview._id);
      return res.status(500).send("Error saving listing. Review has been discarded.");
    }
  
    // Case 6: Success - Redirect to the listing's detail page
    req.flash("success","new review created");
    res.redirect(`/listings/${listing._id}`);
  }));
  
  
  //Delete review route
  router.delete("/:reviewId",wrapAsync(async(req,res)=>{
  let {id,reviewId}=req.params;
  
  await Listing.findByIdAndUpdate(id,{$pull:{reviews: reviewId}});
  await Review.findByIdAndDelete(reviewId);
  req.flash("success"," Review deleted");
  res.redirect(`/listings/${id}`);
  }));

  module.exports=router;
  