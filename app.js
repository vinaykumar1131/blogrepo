require('dotenv').config();
const express = require("express");
const bodyparse = require("body-parser");
const ejs = require("ejs");
const _= require("lodash");
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cookieparser=require('cookie-parser')
const jwt=require('jsonwebtoken');



  
 const app = express();
app.set('view engine', 'ejs');
app.use(bodyparse.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(cookieparser());

mongoose.connect('mongodb+srv://newdb:Vinay11@cluster0.i4u9j.mongodb.net/blog', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex",true);


const logindata=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    number:{
        type:Number,
        minlength:10,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    pass:{
        type:String,
        required:true
    },
    tokens:[{
        token:{
            type:String,
        required:true
        }
    }]
});

logindata.methods.generate=async function(){
    try{
    const token=jwt.sign({_id:this._id.toString()},process.env.SECRET);
    this.tokens=this.tokens.concat({token:token});
    await this.save();
    return token;
    }
    catch(err){
        console.log(err);
    }
}
logindata.pre("save",async function(next){
    if(this.isModified("pass")){
    console.log(this.pass);
    this.pass=await bcrypt.hash(this.pass, 10);
    console.log(this.pass);
    }
    next();
})

const login=mongoose.model("login",logindata);

const auth=async(req,res,next)=>{
    try{
    const token=req.cookies.jwt;
    console.log(token);
    const verifyuser=await jwt.verify(token,process.env.SECRET);
    console.log(verifyuser);
    const ele=await login.findOne({_id:verifyuser._id});
    console.log(ele);
    req.user=ele;
    req.token=token;
    next();
}
catch(err){
    console.log(err);
}
}
const blogsc=new mongoose.Schema({
    title:String,
    postval:String,
    comments:[{
        comment:{
            type:String
        }
    }]
});

const blog=mongoose.model("blog",blogsc);
const hoemcontent="Alexander Graham Bell was a Scottish-born inventor, scientist, and engineer who is credited with inventing and patenting the first practical telephone. He also co-founded the American Telephone and Telegraph Company in 1885.";
 const aboutcontent="Welcome to the Complete Web Development Bootcamp, the only course you need to learn to code and become a full-stack web developer. With over 12,000 ratings and a 4.8 average, my Web Development course is one of the HIGHEST RATED courses in the history of Udemy! ⭐️⭐️⭐️⭐️⭐️ At 50+ hours, this Web Development course is without a doubt the most comprehensive web development course available online. Even if you have zero programming experience, this course will take you from beginner";
 const contact ="This course is quite comprehensive when compared with other courses available on this platform that is why I bought it. It is packed full with amazing content and like the description, it did make me full stack web developer. The instructor is a very good teacher using visual aids (not just talking) and simple illustrations to drive home a point. This course does not teach everything but the basics of everything frontend and backend. I enjoyed the course, the jokes, the projects, challenges.";

app.get("/",function(req,res){
    res.render("front");
    
})
app.get("/logout",auth,async (req,res)=>{
    try{
        // req.user.tokens=req.user.tokens.filter((elem) => {
        //     return elem.token != req.token
        // });
req.user.tokens=[];

    res.clearCookie("jwt");
    await req.user.save();
    res.render("front");
    }
    catch(err){
        console.log(err);
    }
})
app.get("/login",function(req,res){
    res.render("login");
})

app.get("/register",function(req,res){
    res.render("register");
});
app.get("/home",auth,function(req,res){
    
    blog.find({},function(err,ele){
           res.render("home",{value:hoemcontent,posts:ele});
              })
   
});
app.post("/register", async function(req,res){
    const name=req.body.usern;
    const number=req.body.num;
    const pass=req.body.pass;
  
    const email=req.body.email;
    var err="";
     const ele=login.findOne({email:email});
     const emailc=ele.email;
    if(email==emailc){
       err="EMAIL IS ALREADY EXIXTS";
        res.render("register",{'err':err});
    }else{
    const users=new login({
        name:name,
        number:number,
        email:email,
        pass:pass
    });
   const token=await users.generate();
   console.log(token);
   res.cookie("jwt",token,{
       expires:new Date(Date.now()+600000),
       httpOnly:true
   });
 
    users.save();
 res.redirect("/home");
}
});
app.post("/login",async (req,res)=>{
    try{
    const email=req.body.email;
    const pass=req.body.pass;
    const ele= await login.findOne({email:email});
    console.log(ele.name);
    const ismatch=await bcrypt.compare(pass,ele.pass);
    const token=await ele.generate();
    res.cookie("jwt",token,{
        expires:new Date(Date.now()+600000),
        httpOnly:true
    });
    console.log(ismatch); 
    if(ismatch){
        res.redirect("/home");
    }
    else{
        res.redirect("/login");
    }
}
catch(err){
    console.log(err);
}
})


  
app.get("/contact",function(req,res){
    res.render("contact",{contactvalue:contact});
})
app.get("/about",function(req,res){
    res.render("about",{aboutvalue:aboutcontent});
})
app.get("/compose",function(req,res){
    res.render("compose")
})
app.post("/compose",function(req,res){
    const composevalue={
        title: req.body.compose,
        postval: req.body.text
    };
    const data=new blog({
        title:composevalue.title,
        postval:composevalue.postval
    })
   data.save();
   res.redirect("/home");
   res.redirect("/home");  
    
    
   
})
app.get("/login",function(req,res){
    res.render("login");
});

app.get("/port/:postname",function(req,res){
    const name = _.lowerCase(req.params.postname); 
    const ll="";
    blog.find({},function(err,allitems){
    allitems.forEach(function(post){
        const content = _.lowerCase(post.title);
        if(content===name){
          res.render("post",{list:post.title,value:post.postval,comments:post.comments})
           
        }
       
    })
    })
   

});
app.post("/port/:postname", async function(req,res){
    try{

   this.comments=this.comments.concat({comment:comment});
await this.save();
res.redirect("/port/:postname");
    }
    catch(err){
        console.log(err);
    }


});
app.post("/delete",function(req,res){
    const del=req.body.checkbox;
    blog.findByIdAndRemove(del,function(err){
        if(err){
            console.log(err);
        }
        else{
            console.log("delete the item");
            res.redirect("/home");
        }
    })
})


















app.listen(process.env.PORT || 80,function(){
    console.log("hi your server is ready");
})