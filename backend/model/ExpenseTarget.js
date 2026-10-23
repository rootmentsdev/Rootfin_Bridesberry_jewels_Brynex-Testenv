import mongoose from 'mongoose';

const expenseTargetSchema = new mongoose.Schema({
  storeCode: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  subCategory: {
    type: String,
    default: "",
  },
  targetAmount: {
    type: Number,
    required: true,
  }
}, { timestamps: true });

// Unique per store + category + subCategory — no month/week dimension.
// The limit auto-recurs every month by design (one permanent record per store/category).
expenseTargetSchema.index({ storeCode: 1, category: 1, subCategory: 1 }, { unique: true });

const ExpenseTarget = mongoose.model('ExpenseTarget', expenseTargetSchema);
export default ExpenseTarget;
