const mongoose = require("mongoose")

const GroupSchema= new mongoose.Schema({
    name:{type:String, required:true, },
    description: { type: String, required:true },
    created: { type: Date, default: Date.now },
    author:{
		id:{
			type: mongoose.Schema.Types.ObjectId,
			ref:'User'
	      },
    username:String
	},
    members:[{id:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User'
      },username:String}]
});

module.exports=mongoose.model("Group",GroupSchema);