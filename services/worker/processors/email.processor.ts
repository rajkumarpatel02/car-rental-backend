import { exchangeManager } from '../../../shared/rabbitmq/exchange.config';
import { EXCHANGES, EVENT_TYPES } from '../../../shared/events/eventTypes';
import { SendWelcomeEmailJob } from '../jobs/sendWelcomeEmail.job';
import { SendBookingEmailJob } from '../jobs/sendBookingEmail.job';
import { SendReminderEmailJob } from '../jobs/sendReminderEmail.job';

export class EmailProcessor {
  async initialize() {
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

      // console.log('✅ Email Processor: Initialized and listening for events');
    } catch (error) {
      console.error('❌ Email Processor: Failed to initialize:', error);
      throw error;
    }
  }

  private async handleNotificationEvent(message: any) {
    try {
      console.log(`📧 Email Processor: Received notification event - ${message.type}`);
      
      switch (message.type) {
        case EVENT_TYPES.SEND_EMAIL:
          await this.handleSendEmail(message.data);
          break;
        
        default:
          // console.log(`📧 Email Processor: Unhandled notification event type: ${message.type}`);
      }
    } catch (error) {
      console.error('❌ Email Processor: Error processing notification event:', error);
    }
  }

  private async handleUserEvent(message: any) {
    try {
      console.log(`📧 Email Processor: Received user event - ${message.type}`);
      
      if (message.type === EVENT_TYPES.USER_CREATED) {
        await SendWelcomeEmailJob.add({
          userId: message.data.userId,
          email: message.data.email,
          name: message.data.name
        });
        
        // console.log(`✅ Welcome email scheduled for: ${message.data.email}`);
      }
    } catch (error) {
      console.error('❌ Email Processor: Error processing user event:', error);
    }
  }

  private async handleBookingEvent(message: any) {
    try {
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
        
        default:
          // console.log(`📧 Email Processor: Unhandled booking event: ${message.type}`);
      }
    } catch (error) {
      console.error('❌ Email Processor: Error processing booking event:', error);
    }
  }

  private async handleSendEmail(data: any) {
    // console.log('📧 Processing generic email send request:', data);
    // Generic email handler for custom email types
    // You can extend this based on your email template needs
  }

  private async handleBookingConfirmed(bookingData: any) {
    try {
      // console.log(`📧 Processing booking confirmation for: ${bookingData.bookingId}`);
      
      await SendBookingEmailJob.add({
        bookingId: bookingData.bookingId,
        userEmail: bookingData.userEmail || 'user@example.com',
        userName: bookingData.userName || 'Customer',
        carDetails: bookingData.carDetails || {},
        bookingDetails: bookingData.bookingDetails || bookingData,
        emailType: 'confirmation'
      });
      
      // console.log(`✅ Booking confirmation email scheduled for: ${bookingData.bookingId}`);
      
      // Schedule reminder emails
      await this.scheduleReminderEmails(bookingData);
      
    } catch (error) {
      console.error('❌ Error handling booking confirmation:', error);
    }
  }

  private async handleBookingCancelled(bookingData: any) {
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
      
      // console.log(`✅ Booking cancellation email scheduled for: ${bookingData.bookingId}`);
      
    } catch (error) {
      console.error('❌ Error handling booking cancellation:', error);
    }
  }

  private async handleBookingCreated(bookingData: any) {
    try {
      // console.log(`📧 Processing booking creation for: ${bookingData.bookingId}`);
      
      // Send "booking received" email
      await SendBookingEmailJob.add({
        bookingId: bookingData.bookingId,
        userEmail: bookingData.userEmail || 'user@example.com',
        userName: bookingData.userName || 'Customer',
        carDetails: bookingData.carDetails || {},
        bookingDetails: bookingData.bookingDetails || bookingData,
        emailType: 'confirmation'
      });
      
      // console.log(`✅ Booking creation email scheduled for: ${bookingData.bookingId}`);
      
    } catch (error) {
      console.error('❌ Error handling booking creation:', error);
    }
  }

  private async handleBookingFailed(bookingData: any) {
    try {
      console.log(`📧 Processing booking failure for: ${bookingData.bookingId}`);
      
      // Send failure notification email
      await SendBookingEmailJob.add({
        bookingId: bookingData.bookingId,
        userEmail: bookingData.userEmail || 'user@example.com',
        userName: bookingData.userName || 'Customer',
        carDetails: bookingData.carDetails || {},
        bookingDetails: bookingData.bookingDetails || bookingData,
        emailType: 'cancellation'
      });
      
      // console.log(`✅ Booking failure email scheduled for: ${bookingData.bookingId}`);
      
    } catch (error) {
      console.error('❌ Error handling booking failure:', error);
    }
  }

  private async scheduleReminderEmails(bookingData: any) {
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
      
      // console.log(`✅ Reminder emails scheduled for booking: ${bookingId}`);
      
    } catch (error) {
      console.error('❌ Error scheduling reminder emails:', error);
    }
  }

  // Utility method to send custom email notifications
  async sendCustomNotification(data: {
    to: string;
    subject: string;
    template: string;
    context: any;
  }) {
    try {
      console.log(`📧 Sending custom notification to: ${data.to}`);
      
      // Here you can integrate with your email service
      // For now, we'll log the intent
      console.log('Custom email details:', {
        to: data.to,
        subject: data.subject,
        template: data.template
      });
      
      // You can extend this to actually send emails via:
      // - SendGrid
      // - Mailgun  
      // - Nodemailer
      // - AWS SES
      
    } catch (error) {
      console.error('❌ Error sending custom notification:', error);
    }
  }
}