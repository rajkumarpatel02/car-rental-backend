import * as amqp from 'amqplib';

class RabbitMQ {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;

  async connect(): Promise<amqp.Channel> {
    this.connection = await amqp.connect('amqp://localhost:5672');
    this.channel = await this.connection.createChannel();
    return this.channel;
  }

  async createQueue(queueName: string): Promise<void> {
    if (!this.channel) await this.connect();
    await this.channel!.assertQueue(queueName, { durable: true });
  }

  async sendToQueue(queueName: string, message: any): Promise<void> {
    if (!this.channel) await this.connect();
    this.channel!.sendToQueue(queueName, Buffer.from(JSON.stringify(message)));
  }

  async consumeQueue(queueName: string, callback: (message: any) => void): Promise<void> {
    if (!this.channel) await this.connect();
    await this.channel!.consume(queueName, (msg: amqp.ConsumeMessage | null) => {
      if (msg !== null) {
        const content = JSON.parse(msg.content.toString());
        callback(content);
        this.channel!.ack(msg);
      }
    });
  }
}

export const rabbitMQ = new RabbitMQ();