require("dotenv").config();

const express = require("express")
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const SpotifyStrategy = require('passport-spotify').Strategy;
const findOrCreate = require("mongoose-findorcreate");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
var request = require("request");


const app = express();

app.set("view engine", 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static("public"));


app.use(session({
  secret: "Our little secret",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/spotifyDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.set("useCreateIndex", true);

const spotifySchema = new mongoose.Schema({
  email: String,
  password: String,
  spotifyId: String,
  secret: String,
  googleId: String
});

spotifySchema.plugin(passportLocalMongoose);
spotifySchema.plugin(findOrCreate);

const User = new mongoose.model("User", spotifySchema)

passport.use(User.createStrategy());

const port = 3000;
const authCallbackPath = "/auth/spotify/callback";

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(
  new SpotifyStrategy({
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:" + port + authCallbackPath,
    },
    function(accessToken, refreshToken, expires_in, profile, done) {
      User.findOrCreate({
        spotifyId: profile.id
      }, function(err, user) {
        return done(err, user);
      });
    }
  )
);

app.get("/", function(req, res) {
  res.render("home");
});

app.get('/auth/spotify',
  passport.authenticate('spotify', {
    scope: ['user-read-email', 'user-read-private']
  })
);

app.get(authCallbackPath,
  passport.authenticate('spotify', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    res.redirect('/succesful');
  }
);

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/succesful", function(req, res) {
  res.render("succesful");
});


app.get("/success",function(req,res){
  res.render("success");
})

app.post("/register", function(req, res) {

  User.register({
    username: req.body.username
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/succesful");
      });
    }
  });

});

const Usere = new mongoose.model("Usere", spotifySchema)


passport.use(new GoogleStrategy({
    clientID: process.env.id,
    clientSecret: process.env.secret,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    Usere.findOrCreate({
      googleId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));

app.get("/auth/google",
  passport.authenticate("google", {
    scope: ["profile"]
  })
);

app.get("/auth/google/secrets",
  passport.authenticate("google", {
    failureRedirect: "/login"
  }),
  function(req, res) {

    res.redirect("/success");
  });


app.post("/register", function(req, res) {

  Usere.register({
    username: req.body.username
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/success");
      });
    }
  });

  // //create playlist
  // spotifyApi.createPlaylist('Youtube', { 'description': 'Youtube Liked Songs', 'public': false })
  // .then(function(data) {
  //   console.log('Created playlist!');
  //   console.log(data.playlistId);
  // }, function(err) {
  //   console.log('Something went wrong!', err);
  // });

});


app.listen(3000, function(req, res) {
  console.log("Server started succesfully")
});
