import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
       match: /^[A-Za-z\s]+$/
    },
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      match: /^[a-zA-Z0-9_]+$/
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^\S+@\S+\.\S+$/
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      
    },
    avatar: {
        type : String, // cloudinary url
        
    },
    role: {
      type: String,
      enum: ['user', 'barber'],
      default: 'user'
    },
    phone: {
      type: String,
       match: /^[6-9]\d{9}$/ // Indian numbers
    },
    emailVerified : {
      type : Boolean,
      default : false
    },
    emailOtp : String,
    emailOtpExpires: Date,
    refreshToken: {
      type: String
    }
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});


userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}


userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      role: this.role
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '1d'
    }
  );
};
//console.log(process.env.ACCESS_TOKEN_SECRET , "Hello");

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d'
    }
  );
};

export default mongoose.model('User', userSchema);
