const mongoose = require("mongoose")
//passportLocalMongoose = require("passport-local-mongoose");

const PostSchema= new mongoose.Schema({
    title:{type:String, required:true, },
    topic:{type:String, required:true, },
    description: { type: String, required:true },
    created: { type: Date, default: Date.now },
    author:{
		id:{
			type: mongoose.Schema.Types.ObjectId,
			ref:'User'
	      },
    username:String
	}
});

//UserSchema.plugin(passportLocalMongoose);

module.exports=mongoose.model("Post",PostSchema);