import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false
    },
    role: {
      type: String,
      enum: ['admin', 'student'],
      default: 'student'
    },
    lastLogin: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Method to verify password using bcrypt
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Static helper to hash password at cost factor 12 (as specified in SDD)
userSchema.statics.hashPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(plainPassword, salt);
};

const User = mongoose.model('User', userSchema);
export default User;
