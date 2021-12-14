if(process.env.NODE_ENV!=="production"){
  require('dotenv').config();
}

const express=require('express');
const app=express();
const path=require('path')
const mongoose=require('mongoose');
const ejsMate=require('ejs-mate');
const {isLoggedIn}=require('./middleware');
const methodOverride=require('method-override');
const Joi=require('joi');
const QRCode = require('qrcode');
const session =require('express-session');
const MongoDBStore=require('connect-mongo');
const userhome=require('userhome');
// mongo sanitize

const mongoSanitize=require('express-mongo-sanitize');


// joi validation

const {userSchema,sectionSchema,itemSchema}=require('./schema');


const validateUser=(req,res,next)=>{
  const {error}=userSchema.validate(req.body);
  if(error){
    // const msg=error.details.map(el=>el.message).join(',')
    throw new ExpressError("Page not found",404);
  }else{
    next();
  }
}


const validateCourses=(req,res,next)=>{
  const {error}=sectionSchema.validate(req.body);
  if(error){
    // const msg=error.details.map(el=>el.message).join(',')
    throw new ExpressError("Page not found",404);
  }else{
    next();
  }
}

const validateItems=(req,res,next)=>{
  const {error}=itemSchema.validate(req.body);
  if(error){
    // const msg=error.details.map(el=>el.message).join(',')
    throw new ExpressError("Page not found",404);
  }else{
    next();
  }
}


// utils

const catchAsync=require('./utils/catchAsync');
const ExpressError=require('./utils/expressError');



// models

const User=require('./models/user');
const Section=require('./models/section');
const Item=require('./models/item');
// session


// passport

const passport=require('passport');
const {ensureAuth,ensureGuest}=require('./middleware/auth');

require('./google-auth')(passport);

const dbUrl= process.env.DB_URL || 'mongodb://localhost:27017/qrcode-generator';

mongoose.connect(dbUrl,{
    useNewUrlParser:true,
    useCreateIndex:true,
    useUnifiedTopology:true,
    useFindAndModify:false
})

const db=mongoose.connection;
db.on("error",console.error.bind(console,"connection error"));
db.once("open",()=>{
    console.log("Database Connected")
});


app.engine('ejs',ejsMate)
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'));

app.use('/assets',express.static(path.join(__dirname,'assets')));

app.use(express.urlencoded({extended:true}));

app.use(mongoSanitize({
  replaceWith:'_'
}));

const secret=process.env.SECRET ||'thisshouldbeabettersecret!';

const store=new MongoDBStore({
    mongoUrl:dbUrl,
    secret,
    touchAfter:24*60*60
});

store.on("error",function(e){
    console.log("Session store error",e)
})

const sessionConfig={
    store,
    name:"session",
    secret,
    resave:false,
    saveUninitialized:true,
    cookie:{
        httpOnly:true,
        expires:Date.now()+(1000*60*60*24*7),
        maxAge:(1000*60*60*24*7)
    }
}
app.use(session(sessionConfig))
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));
app.use((req,res,next)=>{
  res.locals.currentUser=req.user;
  next();
})



app.get('/',(req,res)=>{
  res.render('index.ejs');    
})
 
app.get('/login',ensureGuest,(req,res)=>{
  res.render('forms/google');
})


app.get('/auth/google',
    passport.authenticate('google',{scope:['profile','email']})
)



app.get('/google/callback',
    passport.authenticate('google',{
        successRedirect:'/',
        failureRedirect:'/auth/failure',
    })
);

app.get('/auth/failure',(req,res)=>{
    res.send("Auth Failure");
});

app.get('/logout',(req,res)=>{
  req.logout();
  res.redirect('/');
})


app.get('/dashboard/:id',isLoggedIn,catchAsync(async(req,res)=>{
  const courses=await User.findById(req.params.id).populate('sections');
  const url=`https://fathomless-garden-77003.herokuapp.com/menu/${req.params.id}`;
  QRCode.toDataURL(url,(err,src)=>{
    if(err){
      res.send("Error");
    }else{
      res.render('dashboard',{courses,src});
    }
  })
}))

// app.get('/:id/download/qrcode',isLoggedIn,catchAsync(async(req,res)=>{
//   const id=req.params.id;
//   QRCode.toFile(`${userhome()}/qrcode.png`, `https://fathomless-garden-77003.herokuapp.com/menu/${id}`, {
//     color: {
//       dark: '#FFFF', 
//       light: '#000' 
//     }
//   }, function (err) {
//     if (err) throw err
//     return res.redirect(`/dashboard/${id}`);
//   })
// }))

app.get('/:id/update',isLoggedIn,catchAsync(async(req,res)=>{
    const user=await User.findById(req.params.id);
    res.render('forms/details',{user});
}))

app.post('/:id/update',isLoggedIn,validateUser,catchAsync(async(req,res)=>{
    const {id}=req.params;
    const user=await User.findByIdAndUpdate(id,{...req.body.user});
    res.redirect(`/dashboard/${user.id}`);
}))


app.post('/dashboard/:userId/sections',validateCourses,catchAsync(async(req,res)=>{
  const user=await User.findById(req.params.userId);
  const section=new Section(req.body.section);
  user.sections.push(section);
  await section.save();
  await user.save();
  res.redirect(`/dashboard/${user._id}`);
}))

app.get('/menu/:id',catchAsync(async(req,res)=>{
  const user=await User.findById(req.params.id).populate('sections');
  res.render('showpages/showpage',{user});
}))

app.get('/menu/:userId/:sectionTitle/:sectionId',catchAsync(async(req,res)=>{
  const {userId,sectionId}=req.params;
  const section=await Section.findById(sectionId).populate('items');
  res.render('showpages/itempage',{section,userId});
}))


app.get('/:sectionTitle/:sectionId/items',isLoggedIn,catchAsync(async(req,res)=>{
  const section=await Section.findById(req.params.sectionId).populate('items');
  res.render('showpages/items',{section});
}))

app.post('/:sectionTitle/:sectionId/items',isLoggedIn,validateItems,catchAsync(async(req,res)=>{
  const section=await Section.findById(req.params.sectionId);
  const item=new Item(req.body.item);
  section.items.push(item);
  await section.save();
  await item.save();
  res.redirect(`/${section.title}/${section._id}/items`);
}))

app.get('/dashboard/generateQR/:id',isLoggedIn,catchAsync(async(req,res)=>{
  res.render('forms/scan-form');
}))


app.delete('/dashboard/:id/sections/:sectionId',isLoggedIn,catchAsync(async(req,res)=>{
  const {id,sectionId}=req.params; 
  await User.findByIdAndUpdate(id,{$pull:{sections:sectionId}});
  await Section.findByIdAndDelete(sectionId);
  res.redirect(`/dashboard/${id}`);
}))

app.delete('/section/:sectionId/item/:itemId',isLoggedIn,catchAsync(async(req,res)=>{
  const {sectionId,itemId}=req.params;
  const section=await Section.findById(sectionId);
  await Section.findByIdAndUpdate(sectionId,{$pull:{items:itemId}});
  await Item.findByIdAndDelete(itemId);
  res.redirect(`/${section.title}/${sectionId}/items`);
}))

app.all('*',(req,res,next)=>{
  next(new ExpressError('Page not found',404));
})

app.use((err,req,res,next)=>{
  const {statusCode=500}=err;
  if(!err.message) err.message="Something went wrong"
  res.status(statusCode).render('error',{err});
})

const port=process.env.PORT || 3000;

app.listen(port,()=>{
    console.log(`Server started ${port}` );
})