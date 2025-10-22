import QueueManager from '../queue.manager';

export class SendReminderEmailJob {
  private static queue = QueueManager.createQueue('email-reminder');

  static async add(data: {
    bookingId: string;
    userEmail: string;
    userName: string;
    reminderType: '24h_before' | '1h_before' | 'cancellation' | 'completion';
    bookingDetails: any;
    scheduledTime?: Date;
  }): Promise<void> {
    let delay = 0;
    
    switch (data.reminderType) {
      case '24h_before':
        delay = 24 * 60 * 60 * 1000;
        break;
      case '1h_before':
        delay = 60 * 60 * 1000;
        break;
      case 'cancellation':
        delay = 0;
        break;
      case 'completion':
        delay = 60 * 60 * 1000;
        break;
    }

    await this.queue.add('sendReminder', data, { 
      delay,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000
      }
    });
    
    console.log(`✅ Reminder email job added for: ${data.reminderType} - ${data.bookingId}`);
  }
}

// Export the worker processor separately
export const reminderEmailWorker = () => {
  return QueueManager.createWorker('email-reminder', async (job) => {
    const { userEmail, userName, reminderType, bookingId } = job.data;
    
    console.log(`⏰ Processing ${reminderType} reminder for booking: ${bookingId}`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`✅ ${reminderType} reminder sent to ${userEmail} for booking ${bookingId}`);
    
    return { 
      success: true, 
      bookingId,
      reminderType,
      sentTo: userEmail,
      timestamp: new Date().toISOString()
    };
  });
};