export interface CreateBookingDto {
  carId: string;
  startDate: string;
  endDate: string;
}

export interface BookingResposeDto {
  id : String;
  userId : string;
  carId : string;
  startDate: Date;
  endDate : Date;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  failureReason: string;
  createdAt: Date;
}

export interface confirmBookingDto {
  paymentData : any;  
  // payment gateway ka resopose.
}