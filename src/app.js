const express = require('express');
let app = express();
const path = require('path') 
const cors = require('cors') 
const WebSocketServer = require('ws')
const session = require('express-session')
const flash = require('connect-flash')
const passport = require('passport')
const { isLoggedIn } = require('./middleware/auth')
const http = require('http')
const PubSub = require('./public/js/pubsub')
const User = require('./models/User');
const Database = require('./database')
const Post = require('./models/Post');
const Group = require('./models/Group');
require('./config/passport')
//routes
const groupsRoutes = require('./routes/groups')


app.server = http.createServer(app);
new Database().connect().then((db) => {
  console.log("Successful connected to database.")
  app.db = db;
}).catch((err) => {
  throw (err);
});


app.wss = new WebSocketServer.Server({
  server: app.server
})
app.wss = new PubSub(app)

app.use(cors({
  exposedHeaders: '*',
}))
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'views')));
app.set('views', path.join(__dirname + '/views'))

//middlewares
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({
  secret: 'mysecret',
  resave: 'true',
  saveUninitialized: 'true'
}));

app.use(passport.initialize())
app.use(passport.session())
app.use(flash())

//Global variables de app
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg')
  res.locals.error_msg = req.flash('error_msg')
  res.locals.error = req.flash('error')
  res.locals.success = req.flash('success')
  res.locals.user = req.user || null
  next();
})

app.use('/group',groupsRoutes);
//routes 
//index
app.get("/", function (req, res) {
  let user = res.locals.user
  if(!user){
  console.log("es nulo", user)
  Post.find({ $or: [ { topic: 'internacional' }, { topic: 'regional' } , { topic: 'nacional' } ] }, function (err, posts) {
    if (err) 
      console.log(err);
    
    else 
        res.render("principal/no_autenticado", { posts: posts.reverse() })            
  }) 
   }
})

app.get("/hidden", isLoggedIn, function (req, res) {
  res.render("index");
})

//principal views
app.get("/autenticado", function (req, res) {
  res.render("principal/autenticado")
})

app.get("/publicador", function (req, res) {
  res.render("principal/publicador")
})

app.get("/p", isLoggedIn, function (req, res) {
  let user = res.locals.user
  var objeto = []
  let topicos = user.topics
  topicos = user.topics
  if (res.locals.user && res.locals.user.role === "publish") {
    res.render("principal/publicador", { id: user.username })
  }
  else {
    topicos.forEach((element) => {
      objeto.push({ topic: element });
      console.log("resultado de", objeto)
    });
    Post.find({ $or: objeto }, function (err, posts) {
      if (err) {
        console.log(err);
      }
      else {
        if (res.locals.user && res.locals.user.role === "reader") {
          Group.find({},(err, groups)=>{
            console.log('-----------------------------',posts)
            res.render("principal/autenticado", { id: user.username, posts: posts.reverse()})
          })
        }
      }
    })
  }
})

//auth
//login
app.get("/login", function (req, res) {
  res.render("authentication/login")
})
app.post("/login", passport.authenticate('local', {
  successRedirect: '/p',
  failureRedirect: '/login',
  failureFlash: true,
  successFlash: 'Welcome'
}),
)
app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/')
})
app.get('/dataUser', function (req, res) {
  if (res.locals.user && res.locals.user.username) {
    let { username, topics, role, _id } = res.locals.user
    user = { _id, username, role, topics, }
    res.json(user)
  }
})

app.get('/data', function (req, res) {
  res.json(res.locals.user)
})
//register
app.get("/register", function (req, res) {
  res.render("authentication/register", { error: false })
})

app.post("/register", async (req, res) => {
  const { username, password, role, topics } = req.body
  const error = [];
  if (!username) {
    error.push({ text: 'Please write a username' })
  }
  if (!password) {
    error.push({ text: 'Please write a password' })
  }
  if (error.length > 0) {
    res.render("authentication/register", {
      error, username, password
    })
  } else {
    const newUser = new User({ username, password, role, topics });
    await newUser.save();
    req.flash('success_msg', 'User Register Successfully');
    passport.authenticate("local")(req, res, function () {
      res.redirect("/p")
    })
  }
})

app.put("/modificar/:id", function (req, res) {
  var ajaxData = req.body
  console.log(req.body)
  User.findById(req.params.id, (error, user) => {
    if (ajaxData.action === "agregar")
      user.topics.push(ajaxData.topic);
    else {
      var newTopics = user.topics.filter((item) => {
        return item != ajaxData.topic
      })
      user.topics = newTopics
    }
    user.save();
  })
})

app.server.listen(3000, () => {
  console.log("servidor activo!!")
});


