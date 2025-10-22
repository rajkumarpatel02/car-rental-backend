import { exchangeManager } from '../../shared/rabbitmq/exchange.config';
import { EmailProcessor } from './processors/email.processor';
import { NotificationProcessor } from './processors/notification.processor';
import { EXCHANGES, EVENT_TYPES } from '../../shared/events/eventTypes';
import QueueManager from './queue.manager';

// Import worker functions
import { welcomeEmailWorker } from './jobs/sendWelcomeEmail.job';
import { bookingEmailWorker } from './jobs/sendBookingEmail.job';
import { reminderEmailWorker } from './jobs/sendReminderEmail.job';

const startWorker = async () => {
  try {
    console.log('👷 Worker: Starting worker service...');

    // Initialize RabbitMQ exchanges
    console.log('👷 Worker: Connecting to RabbitMQ exchanges...');
    await exchangeManager.connect();
    console.log('✅ Worker: Connected to RabbitMQ exchanges');

    // Initialize email workers
    console.log('👷 Worker: Starting email workers...');
    welcomeEmailWorker();
    bookingEmailWorker();
    reminderEmailWorker();
    console.log('✅ Email workers started');

    // Initialize processors
    console.log('👷 Worker: Initializing processors...');
    const emailProcessor = new EmailProcessor();
    const notificationProcessor = new NotificationProcessor();
    
    await emailProcessor.initialize();
    await notificationProcessor.initialize();

    console.log('✅ Worker: All processors initialized');

    // Setup direct queue listeners for backward compatibility
    console.log('👷 Worker: Setting up legacy queue listeners...');
    
    await exchangeManager.subscribeToExchange(
      EXCHANGES.USER,
      'worker_user_events',
      async (message) => {
        if (message.type === EVENT_TYPES.USER_CREATED) {
          console.log('👷 Worker: RECEIVED USER_CREATED event for:', message.data.email);
          
          const { SendWelcomeEmailJob } = await import('./jobs/sendWelcomeEmail.job');
          await SendWelcomeEmailJob.add({
            userId: message.data.userId,
            email: message.data.email,
            name: message.data.name
          });
        }
      }
    );

    console.log('✅ Worker service started and listening for events...');
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('🔻 Received SIGTERM, shutting down gracefully...');
      await QueueManager.closeAll();
      await exchangeManager.close();
      process.exit(0);
    });
    
    process.on('SIGINT', async () => {
      console.log('🔻 Received SIGINT, shutting down gracefully...');
      await QueueManager.closeAll();
      await exchangeManager.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start worker service:', error);
    process.exit(1);
  }
};

startWorker();