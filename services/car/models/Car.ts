import mongoose from 'mongoose';

const carSchema = new mongoose.Schema({
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  pricePerDay: { type: Number, required: true },
  isAvailable: { type: Boolean, default: true },
  image: { type: String },
  features: [String]
}, {
  timestamps: true
});

export const Car = mongoose.model('Car', carSchema);