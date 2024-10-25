const express=require("express");
const app=express();
const users=require("./routes/user.js");
const posts=require("./routes/post.js");
const cookieParser=require("cookie-parser");

app.use(cookieParser("secretcode"));

app.get("/getsignedcookie",(req,res)=>{
    res.cookie("made in","India",{signed:true});
    res.send("signed cookie sent");
})

app.get("/verify",(req,res)=>{
    console.log(req.signedCookies);
    res.send("verified");
})

app.get("/getcookies",(req,res)=>{
    res.cookie("greet","hello");
    res.send("sent youcome cookies");
});

app.get("/greet",(req,res)=>{
    let {name="annonymoue"}=req.cookies;
    res.send(`Hi,${name}`);

})
app.get("/",(req,res)=>{
    res.send("i am robot");

});

app.use("/users",users);
app.use("/posts",posts);
 app.listen(3000,()=>{
    console.log("serer listing");
 });