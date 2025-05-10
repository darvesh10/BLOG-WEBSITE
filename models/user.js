const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema({
    username:{
        type: String,
        required: true,
        trim: true,
        minlength: 3,
    },
    email:{
        type: String,
        required: true,
        trim: true,
        minlength: 5,
    },
    password:{
        type: String,
        required: true,
        minlength: 3,
    },
    createdAt:{
        type: Date,
        default: Date.now,
    }
});

// Hash the password before saving the user
userSchema.pre("save", async (next)=>{
    if(!this.isModified('password')) return next();
    try{
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password,salt)
        next();
    }
    catch (err){
   next(err);
    }
});

module.exports = mongoose.model("user",userSchema);