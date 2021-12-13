
const passport=require('passport')
const User=require('./models/user');
var GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;

const googleId= process.env.GOOGLE_CLIENT_ID;
const googleSecret=process.env.GOOGLE_CLIENT_SECRET;

module.exports=(passport)=>{
  passport.use(new GoogleStrategy({
    clientID:     googleId,
    clientSecret: googleSecret,
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





