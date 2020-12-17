require("dotenv").config();
var SpotifyWebApi = require('spotify-web-api-node');
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
var axios = require('axios');
const { json } = require("body-parser");
const { get } = require("request");
const app = express();

var exports = module.exports = {}
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
    scope: ['user-read-email', 'user-read-private', 'playlist-modify-private', 'playlist-read-private']
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

// create playlist
app.get('/create', (req,res) => {
  axios({
        method: 'POST',
        url: `https://api.spotify.com/v1/me/playlists`,
        data: {
            "name": 'created mofo',
            "description": "Playlist generated ",
            "public": true
        },
        headers: { 
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer BQAv16FdBoXpGZFB5cd9xIG4_0FaMTmZ47DJxy-2kMt9YtIWBMIN6KaYBFFWl_1JAluYQCNxVZlGG-rPlHqHH9EWAr6__zafBTgIGevy_vZ2QtbuUqfACwz3N4yRxBt8-g6U6a8MhBCQIntdFApLVlvXW47KKUYv8uJGhpM0vsuFfEqI3lZ_b10rpJU2zxnH3O6xtpH4nBp-oPJqQ5zPK9H8fFf4_Pv-jzGWn8sf6EbBiiJ-Dcbzm-MroC_tnid276Q',
        }}).then(console.log(res=res.statusCode))
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
});

//get playlist items

app.get('/getSongs', async (req,res) => {

  try{
    const resp = await axios ({
      method: 'GET',
      url:'https://www.googleapis.com/youtube/v3/playlistItems',
      params:{
        part : 'snippet', 
        maxResults : 50,
        playlistId : 'RDCLAK5uy_l78ojmVPyGVEpLjCHi2EEN0QY9ToABVR0',
        key: 'AIzaSyDE5Xjn3DDfgc-4-iOUWLiT_sfwVn8KKz4'
      },  
      headers: { 
        'Accept': 'application/json'
      }
    })
    for(var i=0;i<resp.data.items.length;i++)
    {
    console.log(resp.data.items[i].snippet.title)
  }
  } catch (err) {
    console.log('####################',err)
  }
    // axios ({
    //   method: 'GET',
    //   url:'https://www.googleapis.com/youtube/v3/playlistItems',
    //   params:{
    //     part : 'snippet', 
    //     maxResults : 25,
    //     playlistId : 'RDgwjEbpdaoTc',
    //     key: 'AIzaSyDE5Xjn3DDfgc-4-iOUWLiT_sfwVn8KKz4'
    //   },
    //   headers: { 
    //     'Accept': 'application/json'
    //   }

    // }).then((resp)=> console.log('%%%%%%%%%%%%%%%%%%%%',respta))
    // .catch((error)=>console.log('$$$$$$$$$$$$$$$$$', error))
});


app.listen(3000, function(req, res) {
  console.log("Server started succesfully")
});
