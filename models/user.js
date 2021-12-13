const mongoose=require('mongoose');
const Schema=mongoose.Schema;

const UserSchema=new Schema({
    googleId:{
        type:String,
        required:true
    },
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    title:{
        type:String,
        required:true
    },
    location:{
        type:String,
        required:true
    },
    speciality:{
        type:String,
        required:true
    },
    phone:{
        type:Number,
        required:true
    },
    sections:[
        {
            type:Schema.Types.ObjectId,
            ref:'Section'
        }
    ]
});

module.exports=mongoose.model('User',UserSchema);