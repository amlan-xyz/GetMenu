
const passport=require('passport')
const User=require('./models/user');
var GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;

const GOOGLE_CLIENT_ID='288350490413-urhug0k9lo888esg0hgufuh6kseit3dc.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET='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';

module.exports=(passport)=>{
  passport.use(new GoogleStrategy({
    clientID:     GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/google/callback",
    passReqToCallback   : true
  },
  async function(request, accessToken, refreshToken, profile, done) {
    // console.log("Logged in",profile.displayName,profile.email);
    // return done(null,profile);
    try{
      const user=await User.findOne({email:profile.email});
      if(user){
        return done(null,user);
      }else{
        const newUser=({
          googleId:profile.id,
          name:profile.displayName,
          email:profile.email,
          title:'Name of the resturant',
          location:'Address',
          speciality:'Eg : Chinese and Indian',
          phone:'123456789',
        });
        const user=await User.create(newUser);
        done(null,user);
      }
    }catch(err){
      console.log(err);
    }
   }
  ));

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
}





