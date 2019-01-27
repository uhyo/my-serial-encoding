import { Decoder } from '../decoder';
import { IReadableChannel } from '../interfaces/readableChannel';
import { Queue } from './queue';
import { PendingData } from './data';

/**
 * Something which receives from given channel.
 */
export class Receiver {
  private decoder: Decoder;
  private channel: IReadableChannel;
  /**
   * Queue to store pending data.
   */
  private dataQueue: Queue<PendingData<number>> = new Queue();
  /**
   * internal callback to call when new data is generated.
   */
  private internalCallback:
    | ((err: unknown, data?: number) => void)
    | null = null;
  constructor(channel: IReadableChannel, decoder: Decoder) {
    this.channel = channel;
    this.decoder = decoder;
  }
  /**
   * Start receiving from channel.
   */
  public start() {
    this.channel.registerTickCallback(this.tickCallback.bind(this));
  }
  /**
   * Stop receiving from channel.
   */
  public stop() {
    this.channel.unregisterTickCallback();
  }
  /**
   * Reset the state of decoder.
   */
  public reset() {
    this.decoder.reset();
    this.dataQueue.clear();
  }
  /**
   * Returns async iterator which yields data on every new data.
   */
  public async *iterateData(): AsyncIterableIterator<number> {
    while (true) {
      const data = this.dataQueue.pop();
      if (data != null) {
        if (data.type === 'data') {
          yield data.data;
        } else {
          yield Promise.reject(data.error);
        }
        continue;
      }
      yield new Promise<number>((resolve, reject) => {
        this.internalCallback = (err, data) => {
          this.internalCallback = null;
          if (err != null) {
            reject(err);
          } else {
            resolve(data!);
          }
        };
      });
    }
  }
  /**
   * Callback registered to channel.
   */
  private tickCallback(bit: 0 | 1) {
    this.decoder.tick(bit);
    const state = this.decoder.getState();
    if (state === 'end') {
      // new data is received.
      this.gotData(this.decoder.data);
    } else if (state === 'error') {
      // error occurred.
      this.gotError(this.decoder.error);
    }
  }
  /**
   * Got new data.
   */
  private gotData(data: number): void {
    if (this.internalCallback != null) {
      this.internalCallback(null, data);
    } else {
      this.dataQueue.push({
        type: 'data',
        data,
      });
    }
  }
  /**
   * Got new error.
   */
  private gotError(error: unknown): void {
    if (this.internalCallback != null) {
      this.internalCallback(error);
    } else {
      this.dataQueue.push({
        type: 'error',
        error,
      });
    }
  }
}
