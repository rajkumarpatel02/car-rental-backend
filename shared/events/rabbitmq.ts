import * as amqp from 'amqplib';

class RabbitMQ {
  private connection: any = null;
  private channel: any = null;

  async connect(): Promise<any> {
    try {
      this.connection = await amqp.connect('amqp://localhost:5672');
      this.channel = await this.connection.createChannel();
      console.log('✅ Connected to RabbitMQ');
      return this.channel;
    } catch (error) {
      console.error('❌ RabbitMQ connection error:', error);
      throw error;
    }
  }

  async getChannel(): Promise<any> {
    if (!this.channel) {
      await this.connect();
    }
    return this.channel;
  }

  async createQueue(queueName: string): Promise<void> {
    const channel = await this.getChannel();
    await channel.assertQueue(queueName, { durable: true });
    console.log(`✅ Queue created: ${queueName}`);
  }

  async sendToQueue(queueName: string, message: any): Promise<void> {
    const channel = await this.getChannel();
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
      persistent: true
    });
    console.log(`📤 Message sent to ${queueName}:`, message);
  }

  async consumeQueue(queueName: string, callback: (message: any) => void): Promise<void> {
    const channel = await this.getChannel();

    await channel.assertQueue(queueName, { durable: true });

    console.log(`👂 Listening to queue: ${queueName}`);

    await channel.consume(queueName, (msg: any) => {
      if (msg !== null) {
        try {
          const content = JSON.parse(msg.content.toString());
          console.log(`📥 Message received from ${queueName}:`, content);
          callback(content);
          channel.ack(msg);
        } catch (error) {
          console.error('❌ Error processing message:', error);
          channel.reject(msg, false);
        }
      }
    });
  }
}

export const rabbitMQ = new RabbitMQ();