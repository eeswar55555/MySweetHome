require("dotenv").config();
const express = require("express");
const bodyparser = require("body-parser");
const mongoose = require('mongoose'); 
const encrypt = require("mongoose-encryption");
const md5 = require("md5");
const _ = require("lodash");
const session = require("express-session");
const bcrypt = require('bcryptjs');
// const bcrypt = require('bcrypt');
// const passport = require("passport");
// const LocalStrategy = require("passport-local").Strategy;
// const passportLocalMongoose = require("passport-local-mongoose");
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyparser.urlencoded({extended:true}));
app.use(express.static("public"));

//*********************************** session ************************************ */

app.use(session({
    secret: 'a little secret ♥',
    resave: false,
    saveUninitialized: false,
}));

//************************** DB schemas ************************************ */

mongoose.connect('mongodb://127.0.0.1:27017/MSH_DB');

const locationSchema = new mongoose.Schema({
    city : "String",
    area : "String",
    lat : "Number",
    lon : "Number",
});

const imageSchema = new mongoose.Schema({
    image : "String",
});

const propertySchema = new mongoose.Schema({
    name : "String",
    floor_no : "Number",
    carpet_area : "Number",
    flat_type : "String",
    living_type : "String",
    house_rent : "Number",
    features_provided : "String",
    location : locationSchema,
    contact_number : "Number",
    no_of_bathrooms : "Number",
    tenants_preferred : "String",
    rating : "Number",
    images : [imageSchema],
    owner_id : "String",
})

const tenantSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: { type: String },
});

const ownerSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: { type: String },
    ownerProperties : [propertySchema],
});

//************************************************************************************** */


//************************** DB collections ************************************ */

const Tenant_collection = mongoose.model("Tenant_collection",tenantSchema);

const Owner_collection = mongoose.model("Owner_collection",ownerSchema);

const Property_collection = mongoose.model("Property_collection",propertySchema);


// ***************** welcom , login , sinup pages *************************************

app.get("/",function(req,res){
    res.render("open_page",{});
});


app.get("/tenant_signin",function(req,res){
    res.render("t_open",{});
});

app.get("/owner_signin",function(req,res){
    res.render("o_open",{});
});

app.get("/t_login",function(req,res){
    res.render("t_login",{});
});
app.get("/t_signup",function(req,res){
    res.render("t_signup",{});
});
app.get("/o_signup",function(req,res){
    res.render("o_signup",{});
});
app.get("/o_login",function(req,res){
    res.render("o_login",{});
});
app.get("/o_open",function(req,res){
    res.render("o_open",{});
});
app.get("/t_open",function(req,res){
    res.render("t_open",{});
});

app.post("/t_signup",async function(req,res){

    bcrypt.genSalt(10, (err, salt) => {
        if (err) {
            console.log("errorrrr");
        }
        bcrypt.hash(req.body.password, salt, (err, hash) => {
            if (err) {
                // Handle error
                return;
            }
            hashedPassword=hash;
            const neww = new Tenant_collection({
                username : req.body.username,
                password : hash,
            });
            neww.save();
            req.session.user=neww;
            res.redirect('/tenant_home_page');
        });
    });
});

app.post("/t_login",async function(req,res){

    Tenant_collection.findOne({username:req.body.username})
    .then(function(found_user){
        if(!found_user)
        {
            console.log("not found");
            res.redirect("/t_login");
        }
        else
        {
            bcrypt.compare(req.body.password,found_user.password,function(err,result){
                if(result === true)
                {
                    req.session.user=found_user;
                    res.redirect('/tenant_home_page');
                }
                else
                {
                    console.log("Bad credentials");
                }
            })
        }
    }).catch(function(err){console.log(err);});
});


app.post("/o_signup",async function(req,res){

    bcrypt.genSalt(10, (err, salt) => {
        if (err) {
            console.log("errorrrr");
        }
        bcrypt.hash(req.body.password, salt, (err, hash) => {
            if (err) {
                // Handle error
                return;
            }
            hashedPassword=hash;
            const neww = new Owner_collection({
                username : req.body.username,
                password : hash,
            });
            neww.save();
            req.session.user=neww;
            res.redirect('/owner_home_page');
        });
    });
});

app.post("/o_login",async function(req,res){
    Owner_collection.findOne({username:req.body.username})
    .then(function(found_user){
        if(!found_user)
        {
            console.log("not found");
            res.redirect("/o_login");
        }
        else
        {
            bcrypt.compare(req.body.password,found_user.password,function(err,result){
                if(result === true)
                {
                    req.session.user=found_user;
                    res.redirect('/owner_home_page');
                }
                else
                {
                    console.log("Bad credentials");
                }
            });
        }
    }).catch(function(err){console.log(err);});
});


//*********************** home page tenant ******************************* */

app.get("/tenant_home_page",function(req,res){
    if(req.session.user)
    {
            console.log("came inside");
            res.render("tenant_home_page",{});
    }
    else
    {
        console.log("u r not authenticated");
        res.redirect("/t_open");
    }
});

//*********************** home page owner ******************************* */

app.get("/owner_home_page",function(req,res){
    if(req.session.user)
    {
        console.log("came inside");
        res.render("owner_home_page",{});
    }
    else
    {
        console.log("u r not authenticated");
        res.redirect("/o_open");
    }
});

//*************************** owner properties ************************************* */

app.get("/properties",function(req,res){
    if(!req.session.user)
        res.redirect("/o_open");

    res.render("properties",{props : req.session.user.ownerProperties});
});


app.get("/add_properties",function(req,res){
    if(!req.session.user)
        res.redirect("/o_open");

    res.render("add_properties",{});
});

app.post("/add_properties",function(req,res){

    // const new_loc = new locationSchema();
    const new_property =  {
        name : req.body.name,
        floor_no : req.body.floor_no,
        floor_no : req.body.floor_no,
        carpet_area : req.body.carpet_area,
        no_of_bathrooms : req.body.no_of_bathrooms,
        flat_type : req.body.flat_type,
        living_type : req.body.living_type,
        house_rent : req.body.house_rent,
        features_provided : req.body.features_provided,
        contact_number : req.body.contact_number,
        tenants_preferred : req.body.tenants_preferred,
        location : {
            city : req.body.city,
            area : req.body.area,
        },
        owner_id : req.session.user._id,
    };

    const new_prop = new Property_collection(new_property);
    new_prop.save();

    Owner_collection.findById(req.session.user._id)
    .then(function(Found_user){
        if(Found_user)
        {
            Found_user.ownerProperties.push(new_property);
            Found_user.save();
            req.session.user = Found_user;
            res.redirect("/properties");
        }
        else
        {
            console.log("not found");
        }
    })
    
});


//******************************* search homes *************************************** */


app.get("/search_homes",function(req,res){
    if(!req.session.user)
        res.redirect("/t_open");

    res.render("search_homes",{homes:{}});
});

app.post("/search_homes",function(req,res){

    const loc = req.body.loc;
    console.log(loc);

    Property_collection.find({
        $or: [
            { 'location.city' : loc },
            { 'location.area' : loc }
        ]
    }).then(function(found_homes){
        console.log(found_homes);
        res.render("search_homes",{homes : found_homes});
    }).catch(function(err){console.log(err);});
});

app.get("/homes/:homeID",function(req,res){
    let requestedhomeID = (req.params.homeID);

    Property_collection.findById(requestedhomeID)
    .then(function(found_home){

        res.render("show_home",{home:found_home});

    }).catch((err)=>{console.log(err);});
});

 //*************************** about  ********************************** */
 
 app.get("/o_about",function(req,res){
    res.render("o_about",{});
});

 app.get("/t_about",function(req,res){
     res.render("t_about",{});
});


//*************************** acc  ********************************** */

app.get("/logout",function(req,res){
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Could not log out.');
        } else {
            console.log("Logged out");
            res.redirect("/");
        }
    });
});


//*************************** acc  ********************************** */


app.listen(3000,function(){
    console.log("server is running at 3000 port♥");
});