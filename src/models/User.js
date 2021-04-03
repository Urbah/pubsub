const mongoose = require("mongoose")
//passportLocalMongoose = require("passport-local-mongoose");

const UserSchema= new mongoose.Schema({
username:{type:String, unique:true, required:true},
password:{type:String, required:true},
role:{type:String, required:true},
topics:[]
});

//UserSchema.plugin(passportLocalMongoose);

module.exports=mongoose.model("User",UserSchema);