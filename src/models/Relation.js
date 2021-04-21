const mongoose = require("mongoose");


const Relation= new mongoose.Schema({
    User:{
		id:{
			type: mongoose.Schema.Types.ObjectId,
			ref:'User'
	      },
    username:String
	},
    Group:{
        id:{
            type: mongoose.Schema.Types.ObjectId,
			ref:'Group'
    },
    name:String
}}, {collection:'relation'});

module.exports=mongoose.model("Relation",Relation);