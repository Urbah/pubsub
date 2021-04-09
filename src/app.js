const express = require('express');
let app = express();
const path = require('path')
const cors =  require('cors')
const WebSocketServer = require('ws')
const session = require('express-session')
const flash = require('connect-flash')
const passport = require('passport')
const {isLoggedIn} = require('./middleware/auth')
const http = require('http')
const PubSub = require('./public/js/pubsub')
const User = require('./models/User');
const Database = require('./database')
require('./config/passport')

app.server = http.createServer(app);


new Database().connect().then((db) => {

	console.log("Successful connected to database.")
  //console.log(db)
	app.db = db;
	
}).catch((err) => {


	throw(err);
});



app.wss = new WebSocketServer.Server({
  server: app.server
})
app.wss= new PubSub(app)
console.log('app.db'+app.db)
app.use(cors({
    exposedHeaders: '*',
  }))
app.set("view engine","ejs");
//static files
app.use(express.static(path.join(__dirname , 'views')));// indicando donde buscaremos los archivos que necesitara el servidor
app.set('views',path.join(__dirname+'/views'))// monstrandole donde buscar las vistas

//config



//middlewares
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(session({
  secret:'mysecret',
  resave:'true',
  saveUninitialized:'true'
}));
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())

//Global variables
app.use((req, res, next)=>{
  res.locals.success_msg = req.flash('success_msg')
  res.locals.error_msg = req.flash('error_msg')
  res.locals.error = req.flash('error')
  res.locals.success = req.flash('success')
  res.locals.user = req.user || null
  /*if(!app.pubsub.session){
    app.pubsub.reciveClientData(res.locals.user)
  }*/
  //crear una variable que pase a true cuando se ejecute esta funcion, para que solo se ejecute una vez
  //console.log(res.locals)
  next();
})

//routes 
//index
app.get("/", function(req, res){
    console.log('req.user  '+req.user)
    
    res.render("index");
   // console.log(app.pubsub.clients._root.entries)
    console.log('geeeeeeeeeettttttttt')
  //  console.log(app.pubsub.clients.get('a044ba30-94cc-11eb-87a6-df938383b27c'))
    //console.log(app.pubsub)
})
app.get("/hidden",isLoggedIn, function(req, res){
    res.render("index");
})
//auth
  //login
app.get("/login", function(req, res){
  res.render("authentication/login")
})
app.post("/login",passport.authenticate('local',{
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true,
  successFlash: 'Welcome'
}),
)
app.get('/logout', (req, res)=>{
  req.logout();
  res.redirect('/')
})
app.get('/dataUser', function(req, res){
  if(res.locals.user && res.locals.user.username){
  let {username, topics, role, _id} =  res.locals.user
    user={_id,username,role,topics,}
    res.json(user)
  }
})

  //register
app.get("/register", function(req, res){
  res.render("authentication/register", {error:false})
})
app.post("/register", async(req, res)=>{
  const {username, password, role, topics} = req.body
  const error=[];
  if(!username){
    error.push({text: 'Please write a username'})
  }
  if(!password){
    error.push({text: 'Please write a password'})
  }
  if(error.length > 0){
      res.render("authentication/register",{
      error, username, password
    })
  }else{
    const newUser = new User({username, password, role, topics});
    await newUser.save();
    req.flash('success_msg', 'User Register Successfully');
    passport.authenticate("local")(req, res, function(){
			res.redirect("/")
		})
  }
})



app.server.listen(3000, ()=>{
    console.log("servidor activo!!")
});