import * as amqp from 'amqplib';

export class ExchangeManager {
  private connection: any = null;
  private channel: any = null;
  private static instance: ExchangeManager;

  private constructor() {}

  static getInstance(): ExchangeManager {
    if (!ExchangeManager.instance) {
      ExchangeManager.instance = new ExchangeManager();
    }
    return ExchangeManager.instance;
  }

  async connect(): Promise<any> {
    if (this.channel) return this.channel;

    this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost:5672');
    this.channel = await this.connection.createChannel();
    
    // Declare exchanges
    await this.channel.assertExchange('booking_events', 'fanout', { durable: true });
    await this.channel.assertExchange('car_events', 'fanout', { durable: true });
    await this.channel.assertExchange('notification_events', 'fanout', { durable: true });
    await this.channel.assertExchange('user_events', 'fanout', { durable: true });
    
    console.log('✅ RabbitMQ Exchanges initialized');
    return this.channel;
  }

  async publishToExchange(exchange: string, message: any): Promise<boolean> {
    const channel = await this.connect();
    return channel.publish(exchange, '', Buffer.from(JSON.stringify(message)), {
      persistent: true
    });
  }

  async subscribeToExchange(
    exchange: string, 
    queueName: string, 
    handler: (message: any) => void,
    options: { durable?: boolean } = { durable: true }
  ): Promise<void> {
    const channel = await this.connect();
    
    // Assert exchange
    await channel.assertExchange(exchange, 'fanout', { durable: true });
    
    // Assert queue
    const queue = await channel.assertQueue(queueName, { 
      durable: options.durable ?? true 
    });
    
    // Bind queue to exchange
    await channel.bindQueue(queue.queue, exchange, '');
    
    // console.log(`✅ Subscribed to exchange "${exchange}" with queue "${queueName}"`);
    
    // Consume messages
    await channel.consume(queue.queue, (msg: any) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          console.log(`📨 Received message from ${exchange}: ${content.type}`);
          handler(content);
          channel.ack(msg);
        } catch (error) {
          console.error('❌ Error processing message:', error);
          channel.nack(msg, false, false);
        }
      }
    });
  }

  async close(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
      this.channel = null;
    }
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }
}

export const exchangeManager = ExchangeManager.getInstance();