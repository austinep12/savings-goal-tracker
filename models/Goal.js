const mongoose = require('mongoose');

const CATEGORIES = [
  'Emergency',
  'Tech & Gadgets',
  'Education',
  'Travel',
  'Vehicle',
  'Other'
];

const goalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false // Optional for backward compatibility
    },
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true,
      minlength: [3, 'Goal title must be at least 3 characters'],
      maxlength: [50, 'Goal title cannot exceed 50 characters']
    },
    targetAmount: {
      type: Number,
      required: [true, 'Target amount is required'],
      min: [1, 'Target amount must be at least $1']
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: [0, 'Current amount cannot be negative'],
      max: [1000000, 'Current amount cannot exceed $1,000,000']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: CATEGORIES,
        message: '{VALUE} is not a valid category. Valid options are: ' + CATEGORIES.join(', ')
      }
    },
    targetDate: {
      type: Date,
      required: [true, 'Target date is required']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [250, 'Description cannot exceed 250 characters'],
      default: ''
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for progress percentage
goalSchema.virtual('progressPercentage').get(function () {
  if (!this.targetAmount || this.targetAmount <= 0) return 0;
  const percentage = (this.currentAmount / this.targetAmount) * 100;
  return Math.min(100, Math.round(percentage * 10) / 10);
});

// Virtual for remaining amount
goalSchema.virtual('remainingAmount').get(function () {
  const remaining = this.targetAmount - this.currentAmount;
  return remaining > 0 ? remaining : 0;
});

// Pre-save hook: automatically update isCompleted if currentAmount meets or exceeds targetAmount
goalSchema.pre('save', function (next) {
  if (this.currentAmount >= this.targetAmount) {
    this.isCompleted = true;
  } else {
    this.isCompleted = false;
  }
  next();
});

module.exports = mongoose.model('Goal', goalSchema);
module.exports.CATEGORIES = CATEGORIES;
