const mongoose=require('mongoose');
const Schema=mongoose.Schema;


const sectionSchema=new Schema({
    title:String,
    items:[
        {
            type:Schema.Types.ObjectId,
            ref:'Item'
        }
    ]
});

module.exports=mongoose.model("Section",sectionSchema);