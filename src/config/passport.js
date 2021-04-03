const passport = require('passport')
const LocalStrategy = require('passport-local')
const User = require('../models/User')


passport.use(
  new LocalStrategy(
    {
      usernameField: "username",
    },
    async (username, password, done) => {
      // Match Email's User
      const user = await User.findOne({ username: username });
      if (!user) {
        return done(null, false, { message: "Not User found." });
      } else {
        // Match Password's User
        const match = user.password === password;
        if (match) {
          return done(null, user);
        } else {
          return done(null, false, { message: "Incorrect Password." });
        }
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});