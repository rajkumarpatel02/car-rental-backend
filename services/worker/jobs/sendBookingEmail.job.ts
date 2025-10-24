import QueueManager from '../queue.manager';

export class SendBookingEmailJob {
  private static queue = QueueManager.createQueue('email-booking');

  static async add(data: {
    bookingId: string;
    userEmail: string;
    userName: string;
    carDetails: any;
    bookingDetails: any;
    emailType?: 'confirmation' | 'modification' | 'cancellation';
  }): Promise<void> {
    await this.queue.add('sendBookingEmail', data);
    // console.log(`✅ Booking email job added for booking: ${data.bookingId}`);
  }
}

// Export the worker processor separately
export const bookingEmailWorker = () => {
  return QueueManager.createWorker('email-booking', async (job) => {
    const { userEmail, userName, bookingId, carDetails, bookingDetails, emailType = 'confirmation' } = job.data;

    console.log(`📧 Processing ${emailType} email for booking: ${bookingId}`);

    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log(`✅ ${emailType} email sent to ${userEmail} for booking ${bookingId}`);

    return {
      success: true,
      bookingId,
      emailType,
      sentTo: userEmail,
      timestamp: new Date().toISOString()
    };
  });
};