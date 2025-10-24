import { exchangeManager } from '../../../shared/rabbitmq/exchange.config';
import { EXCHANGES, EVENT_TYPES } from '../../../shared/events/eventTypes';
import { SendWelcomeEmailJob } from '../jobs/sendWelcomeEmail.job';
import { SendBookingEmailJob } from '../jobs/sendBookingEmail.job';
import { SendReminderEmailJob } from '../jobs/sendReminderEmail.job';
import { RedisManager } from '../../../shared/redis/redis.config';

interface BookingData {
  bookingId: string;
  userEmail?: string;
  userName?: string;
  carDetails?: any;
  bookingDetails?: any;
}

interface CustomNotificationData {
  to: string;
  subject: string;
  template: string;
  context: any;
}

export class EmailProcessor {
  private processedMessages: Set<string> = new Set();

  async initialize(): Promise<void> {
    console.log('📧 Email Processor: Initializing...');

    try {
      // Subscribe to notification events
      await exchangeManager.subscribeToExchange(
        EXCHANGES.NOTIFICATION,
        'email_processor',
        this.handleNotificationEvent.bind(this)
      );

      // Also subscribe to user events for welcome emails
      await exchangeManager.subscribeToExchange(
        EXCHANGES.USER,
        'email_processor_user',
        this.handleUserEvent.bind(this)
      );

      // Subscribe to booking events for booking-related emails
      await exchangeManager.subscribeToExchange(
        EXCHANGES.BOOKING,
        'email_processor_booking',
        this.handleBookingEvent.bind(this)
      );

    } catch (error) {
      console.error('❌ Email Processor: Failed to initialize:', error);
      throw error;
    }
  }

  private async handleNotificationEvent(message: any): Promise<void> {
    try {
      const messageId = this.getMessageId(message);
      if (await this.isDuplicate(messageId)) return;

      console.log(`📧 Email Processor: Received notification event - ${message.type}`);
      
      switch (message.type) {
        case EVENT_TYPES.SEND_EMAIL:
          await this.handleSendEmail(message.data);
          break;
      }
    } catch (error) {
      console.error('❌ Email Processor: Error processing notification event:', error);
    }
  }

  private async handleUserEvent(message: any): Promise<void> {
    try {
      const messageId = this.getMessageId(message);
      if (await this.isDuplicate(messageId)) return;

      console.log(`📧 Email Processor: Received user event - ${message.type}`);
      
      if (message.type === EVENT_TYPES.USER_CREATED) {
        await SendWelcomeEmailJob.add({
          userId: message.data.userId,
          email: message.data.email,
          name: message.data.name
        });
      }
    } catch (error) {
      console.error('❌ Email Processor: Error processing user event:', error);
    }
  }

  private async handleBookingEvent(message: any): Promise<void> {
    try {
      const messageId = this.getMessageId(message);
      if (await this.isDuplicate(messageId)) return;

      console.log(`📧 Email Processor: Received booking event - ${message.type}`);
      
      switch (message.type) {
        case EVENT_TYPES.BOOKING_CONFIRMED:
          await this.handleBookingConfirmed(message.data);
          break;
        
        case EVENT_TYPES.BOOKING_CANCELLED:
          await this.handleBookingCancelled(message.data);
          break;
        
        case EVENT_TYPES.BOOKING_CREATED:
          await this.handleBookingCreated(message.data);
          break;
        
        case EVENT_TYPES.BOOKING_FAILED:
          await this.handleBookingFailed(message.data);
          break;
      }
    } catch (error) {
      console.error('❌ Email Processor: Error processing booking event:', error);
    }
  }

  private async handleSendEmail(data: any): Promise<void> {
    // Generic email handler for custom email types
  }

  private async handleBookingConfirmed(bookingData: BookingData): Promise<void> {
    try {
      console.log(`📧 Processing booking confirmation for: ${bookingData.bookingId}`);
      
      await SendBookingEmailJob.add({
        bookingId: bookingData.bookingId,
        userEmail: bookingData.userEmail || 'user@example.com',
        userName: bookingData.userName || 'Customer',
        carDetails: bookingData.carDetails || {},
        bookingDetails: bookingData.bookingDetails || bookingData,
        emailType: 'confirmation'
      });
      
      // Schedule reminder emails
      await this.scheduleReminderEmails(bookingData);
      
    } catch (error) {
      console.error('❌ Error handling booking confirmation:', error);
    }
  }

  private async handleBookingCancelled(bookingData: BookingData): Promise<void> {
    try {
      console.log(`📧 Processing booking cancellation for: ${bookingData.bookingId}`);
      
      await SendBookingEmailJob.add({
        bookingId: bookingData.bookingId,
        userEmail: bookingData.userEmail || 'user@example.com',
        userName: bookingData.userName || 'Customer',
        carDetails: bookingData.carDetails || {},
        bookingDetails: bookingData.bookingDetails || bookingData,
        emailType: 'cancellation'
      });
      
    } catch (error) {
      console.error('❌ Error handling booking cancellation:', error);
    }
  }

  private async handleBookingCreated(bookingData: BookingData): Promise<void> {
    try {
      console.log(`📧 Processing booking creation for: ${bookingData.bookingId}`);
      
      await SendBookingEmailJob.add({
        bookingId: bookingData.bookingId,
        userEmail: bookingData.userEmail || 'user@example.com',
        userName: bookingData.userName || 'Customer',
        carDetails: bookingData.carDetails || {},
        bookingDetails: bookingData.bookingDetails || bookingData,
        emailType: 'confirmation'
      });
      
    } catch (error) {
      console.error('❌ Error handling booking creation:', error);
    }
  }

  private async handleBookingFailed(bookingData: BookingData): Promise<void> {
    try {
      console.log(`📧 Processing booking failure for: ${bookingData.bookingId}`);
      
      await SendBookingEmailJob.add({
        bookingId: bookingData.bookingId,
        userEmail: bookingData.userEmail || 'user@example.com',
        userName: bookingData.userName || 'Customer',
        carDetails: bookingData.carDetails || {},
        bookingDetails: bookingData.bookingDetails || bookingData,
        emailType: 'cancellation'
      });
      
    } catch (error) {
      console.error('❌ Error handling booking failure:', error);
    }
  }

  private async scheduleReminderEmails(bookingData: BookingData): Promise<void> {
    try {
      const { bookingId, userEmail, userName, bookingDetails } = bookingData;
      
      // Schedule 24-hour before reminder
      await SendReminderEmailJob.add({
        bookingId,
        userEmail: userEmail || 'user@example.com',
        userName: userName || 'Customer',
        reminderType: '24h_before',
        bookingDetails: bookingDetails || bookingData
      });
      
      // Schedule 1-hour before reminder
      await SendReminderEmailJob.add({
        bookingId,
        userEmail: userEmail || 'user@example.com',
        userName: userName || 'Customer',
        reminderType: '1h_before',
        bookingDetails: bookingDetails || bookingData
      });
      
      console.log(`✅ Reminder emails scheduled for booking: ${bookingId}`);
      
    } catch (error) {
      console.error('❌ Error scheduling reminder emails:', error);
    }
  }

  // Utility method to send custom email notifications
  async sendCustomNotification(data: CustomNotificationData): Promise<void> {
    try {
      console.log(`📧 Sending custom notification to: ${data.to}`);
      
      // Integration with email service would go here
      
    } catch (error) {
      console.error('❌ Error sending custom notification:', error);
    }
  }

  private getMessageId(message: any): string {
    return `${message.type}-${message.data?.bookingId || message.data?.userId || Date.now()}`;
  }

  private async isDuplicate(messageId: string): Promise<boolean> {
    const key = `email_processed:${messageId}`;
    const isDuplicate = await RedisManager.exists(key);
    
    if (!isDuplicate) {
      await RedisManager.set(key, 'true', 3600); // 1 hour TTL
      return false;
    }
    
    console.log(`🔄 Skipping duplicate email message: ${messageId}`);
    return true;
  }
}