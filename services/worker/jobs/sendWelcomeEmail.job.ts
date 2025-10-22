import QueueManager from '../queue.manager';

export class SendWelcomeEmailJob {
  private static queue = QueueManager.createQueue('email-welcome');

  static async add(data: {
    userId: string;
    email: string;
    name: string;
  }): Promise<void> {
    await this.queue.add('sendWelcomeEmail', data, {
      delay: 1000,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000
      }
    });
    console.log(`✅ Welcome email job added for: ${data.email}`);
  }
}

// Export the worker processor separately
export const welcomeEmailWorker = () => {
  return QueueManager.createWorker('email-welcome', async (job) => {
    const { email, name } = job.data;
    
    console.log(`📧 Processing welcome email for: ${email}`);
    
    // Simulate email sending process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(`✅ Welcome email sent to ${email} for ${name}`);
    
    return { 
      success: true, 
      sentTo: email,
      timestamp: new Date().toISOString()
    };
  });
};