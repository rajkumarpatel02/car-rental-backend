import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IBooking extends Document{
    _id: Types.ObjectId;
    userId: string;
    carId: string;
    startDate: Date;
    endDate: Date;
    totalPrice: number;
    status: "pending" | "available" | "confirmed" | "cancelled" | "failed" ;
    paymentStatus: "pending" | "paid" | "failed" | "refunded";
    failureReason?: string;
    createdAt: Date;
    updateAt: Date;
}

const bookingSchema = new Schema<IBooking> ({
  userId: {type: String, requered: true}, 
  carId: {type: String, required: true},
  startDate: {type: Date, required: true}, 
  endDate: {type: Date, required: true},
  totalPrice : {type: Number, required: true}, 
  status : {
    type: String, 
    enum : [ 'pending', 'available','confirmed','cancelled', 'failed'],
     default: 'pending'
  },
  paymentStatus: {
    type: String , 
    enum : ['pending', 'paid', 'failde', 'refunded'],
    default: 'pending'
  },
  failureReason : {type : String}
 
} ,{
  timestamps: true
})


export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);