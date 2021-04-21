const express    = require("express")
const router     = express.Router({mergeParams:true})
const Group 	 = require("../models/Group")


router.get("/new", function (req, res) {
	res.render("grupos/new")
  });
  
router.get('/:id', (req, res)=>{
	const id = req.params.id 

	Group.findById(id,(err, group)=>{
		if(err){
			console.log(err)
			res.redirect('/p')
		}else{
			res.render('grupos/show', {group:group })
		}
	})

});

router.post("/", function(req, res){
	Group.create(req.body, (err, group)=>{
		if(err){
		console.log(err)
		}else{
		group.author.id = req.user._id
		group.author.username = req.user.username
		group.save()
		}
	})
	res.redirect('/p')
	});
  
  module.exports = router;