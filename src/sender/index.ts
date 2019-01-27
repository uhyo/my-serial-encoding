import { IWritableChannel } from '../interfaces/writableChannel';
import { SenderOptions, defaultSenderOptions } from '../options/sender';
import { Encoder } from '../encoder';

/**
 * Type of data that can be sent via Sender.
 */
type SenderData = Uint8Array | Uint16Array | Uint32Array;

/**
 * Something which sends given data through given output./
 */
export class Sender<D extends SenderData> {
  private channel: IWritableChannel;
  private encoder: Encoder;
  private options: SenderOptions;
  /**
   * Data which is being sent.
   */
  private data: D | null = null;
  /**
   * Offset of data which is next sent.
   */
  private dataOffset: number = 0;
  constructor(
    channel: IWritableChannel,
    encoder: Encoder,
    options: Partial<SenderOptions> = {},
  ) {
    this.channel = channel;
    this.encoder = encoder;
    this.options = {
      ...defaultSenderOptions,
      ...options,
    };
  }
  /**
   * start writing to channel.
   */
  public start() {
    this.channel.registerTickCallback(this.tick.bind(this));
  }
  /**
   * stop writing to channel.
   */
  public stop() {
    this.channel.unregisterTickCallback();
  }
  /**
   * set data written to channel.
   * Removes remaining data to send.
   */
  public setData(d: D) {
    this.data = d;
    this.dataOffset = 0;
  }
  /**
   * add data written to channel.
   * New data is written after current data is all sent.
   */
  public addData(d: D) {
    if (this.data == null) {
      this.setData(d);
      return;
    }
    // extend data.
    // memo: ArrayBuffer.prototype.transfer
    const newData = new (this.data.constructor as new (length: number) => D)(
      this.data.length + d.length,
    );
    newData.set(this.data);
    newData.set(d, this.data.length);
    this.data = newData;
  }
  /**
   * Write a tick to underlying channel.
   */
  private tick(): 0 | 1 {
    if (this.data != null) {
      const es = this.encoder.getState();
      if (es === 'idle' || es === 'end') {
        // next data can be written to encoder.
        this.encoder.setData(this.data[this.dataOffset]);
        this.moveDataOffset();
      }
    }
    return this.encoder.tick();
  }
  /**
   * Move data offset to next.
   */
  private moveDataOffset() {
    if (this.data == null) {
      return;
    }
    this.dataOffset++;
    if (this.dataOffset >= this.data.length) {
      // oops!
      this.data = null;
      this.dataOffset = 0;
    }
  }
}
