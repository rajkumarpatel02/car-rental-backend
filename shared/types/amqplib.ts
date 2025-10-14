declare module 'amqplib' {
  export interface Connection {
    createChannel(): Promise<Channel>;
    close(): Promise<void>;
  }

  export interface Channel {
    assertQueue(queue: string, options?: any): Promise<any>;
    sendToQueue(queue: string, content: Buffer): boolean;
    consume(queue: string, callback: (msg: ConsumeMessage | null) => void): Promise<any>;
    ack(message: ConsumeMessage): void;
  }

  export interface ConsumeMessage {
    content: Buffer;
  }

  export function connect(url: string): Promise<Connection>;
}