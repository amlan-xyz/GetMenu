const mongoose=require('mongoose');
const Schema=mongoose.Schema;

const ItemSchema=new Schema({
    title:String,
    price:Number
});

module.exports=mongoose.model('Item',ItemSchema);