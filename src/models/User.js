import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 50
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    role: {
      type: String,
      enum: ['reporter', 'editor'],
      required: true
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    }
  },
  { timestamps: true }
);

userSchema.methods.setPassword = function setPassword(password) {
  this.passwordHash = bcrypt.hashSync(password, 12);
};

userSchema.methods.verifyPassword = function verifyPassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    username: this.username,
    displayName: this.displayName,
    role: this.role
  };
};

export const User = mongoose.model('User', userSchema);
