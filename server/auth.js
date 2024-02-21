let passport = require("passport")
let GoogleStrategy = require("passport-google-oauth2").Strategy;
const dotenv=require("dotenv")
if (process.env.NODE_ENV != undefined) {
  let env = process.env.NODE_ENV.trim();
  let path = "";

  switch (env) {
    case "development":
      path = "./.env";
      break;
    case "production":
      path = "./.env.production";
  }
  dotenv.config({
    path: path,
  });
}
passport.serializeUser((user,done)=>{
    done(null,user)
})

passport.deserializeUser((user,done)=>{
    done(null,user);
})

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.GOOGLE_CALLBACK_URL.trim()}/api/auth/google/callback`,
      passReqToCallback: true,
    },
    function (request, accessToken, refreshToken, profile, done) {
    //   User.findOrCreate({ googleId: profile.id }, function (err, user) {
    //     return done(err, user);
    //   });
    // profile.id
    debugger;
    done(null,profile);
    }
  )
);

module.exports={
    passport:passport
}
