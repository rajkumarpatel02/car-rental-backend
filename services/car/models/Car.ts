import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICar extends Document {
  _id: Types.ObjectId;
  brand: string;           // Changed from 'make' to 'brand'
  modelName: string;       // Changed from 'model' to 'modelName'
  year: number;
  pricePerDay: number;
  isAvailable: boolean;
  image?: string;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

const carSchema = new Schema<ICar>({
  brand: { type: String, required: true },        // Changed from 'make'
  modelName: { type: String, required: true },    // Changed from 'model'
  year: { type: Number, required: true },
  pricePerDay: { type: Number, required: true },
  isAvailable: { type: Boolean, default: true },
  image: { type: String },
  features: [String]
}, {
  timestamps: true
});

export const Car = mongoose.model<ICar>('Car', carSchema);