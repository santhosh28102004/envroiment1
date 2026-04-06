import mongoose from 'mongoose';

const completedChallengeSchema = new mongoose.Schema(
  {
    challengeId: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    points: {
      type: Number,
      default: 10,
      min: 0
    }
  },
  { _id: false }
);

const streakSchema = new mongoose.Schema(
  {
    current: {
      type: Number,
      default: 0
    },
    longest: {
      type: Number,
      default: 0
    },
    lastCompletedAt: {
      type: Date,
      default: null
    }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      unique: true,
      index: true,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    points: {
      type: Number,
      default: 0,
      min: 0
    },
    impactScore: {
      type: Number,
      default: 0,
      min: 0
    },
    level: {
      type: Number,
      default: 1,
      min: 1
    },
    badges: {
      type: [String],
      default: ['Beginner']
    },
    completedChallenges: {
      type: [completedChallengeSchema],
      default: []
    },
    streak: {
      type: streakSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true,
    collection: 'appUsers'
  }
);

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
