const mongoose = require('mongoose');
const connectDB = async ()=>{
try{
    const conn = await mongoose.connect(process.env.MONGO_URI)
    console.log('mongo db is connected');
}
catch(err){
console.log(err);
}
};


module.exports = connectDB;