import { Queue, Worker, Job } from 'bullmq';
import { RedisManager } from '../../shared/redis/redis.config';

export class QueueManager {
  private static queues: Map<string, Queue> = new Map();
  private static workers: Map<string, Worker> = new Map();

  static createQueue(name: string): Queue {
    if (this.queues.has(name)) {
      return this.queues.get(name)!;
    }

    const queue = new Queue(name, {
      connection: RedisManager.getInstance(),
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 1000,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        }
      }
    });

    this.queues.set(name, queue);
    console.log(`✅ Created queue: ${name}`);
    return queue;
  }

  static createWorker<T = any>(
    queueName: string, 
    processor: (job: Job<T>) => Promise<any>,
    options: { concurrency?: number } = {}
  ): Worker {
    const worker = new Worker(queueName, processor, {
      connection: RedisManager.getInstance(),
      concurrency: options.concurrency || 10
    });

    worker.on('completed', (job) => {
      console.log(`✅ Job ${job.id} completed successfully on queue ${queueName}`);
    });

    worker.on('failed', (job, err) => {
      console.error(`❌ Job ${job?.id} failed on queue ${queueName}:`, err);
    });

    worker.on('error', (err) => {
      console.error(`❌ Worker error on queue ${queueName}:`, err);
    });

    this.workers.set(queueName, worker);
    console.log(`✅ Created worker for queue: ${queueName}`);
    return worker;
  }

  static getQueue(name: string): Queue | undefined {
    return this.queues.get(name);
  }

  static async closeAll(): Promise<void> {
    for (const [name, worker] of this.workers) {
      await worker.close();
      console.log(`🔒 Closed worker: ${name}`);
    }
    
    for (const [name, queue] of this.queues) {
      await queue.close();
      console.log(`🔒 Closed queue: ${name}`);
    }
    
    this.workers.clear();
    this.queues.clear();
  }
}

export default QueueManager;