import { EncoderOptions, defaultOptions, validateOptions } from './options';

/**
 * State of encoder.
 */
export type State = 'idle' | 'start' | 'data' | 'parity' | 'end';

export { EncoderOptions };

export class Encoder {
  private state: State = 'idle';
  private data: number = 0;
  private bitIndex: number = 0;
  private currentParity: number = 0;
  /**
   * Number of bits of data.
   */
  public readonly options: Readonly<EncoderOptions>;

  /**
   *
   * @param options options.
   */
  constructor(options?: Partial<EncoderOptions>) {
    const opts = {
      ...defaultOptions,
      ...options,
    };
    validateOptions(opts);
    this.options = opts;
  }
  /**
   * Should be called every tick.
   * Returns an output bit for that tick.
   */
  public tick(): 0 | 1 {
    switch (this.state) {
      case 'idle': {
        // there is no data to sent.
        return 1;
      }
      case 'start': {
        this.state = 'data';
        this.bitIndex = 0;
        this.currentParity = 0;
        // sent the start bit.
        return 0;
      }
      case 'data': {
        const { bits, order, parity } = this.options;
        // determine which bit (counted from LSB should be sent).
        const sentbit =
          order === 'LtM' ? this.bitIndex : bits - this.bitIndex - 1;

        const bit = (this.data / 2 ** sentbit) & 1;
        this.currentParity ^= bit;

        this.bitIndex++;
        if (this.bitIndex >= bits) {
          // all data is sent.
          this.state = parity != null ? 'parity' : 'end';
        }
        return bit as 0 | 1;
      }
      case 'parity': {
        this.state = 'end';
        // this state is reachable only when `this.options.parity` is not null.
        return (this.currentParity ^ this.options.parity!) as 0 | 1;
      }
      case 'end': {
        this.state = 'idle';
        // sent the end bit.
        return 1;
      }
    }
  }
  /**
   * Set a new byte to encode.
   */
  public setData(byte: number): void {
    if (
      !Number.isSafeInteger(byte) ||
      byte < 0 ||
      2 ** this.options.bits <= byte
    ) {
      throw new RangeError('Data is out of range');
    }
    if (this.state !== 'idle') {
      throw new Error('Previous data is not encoded yet');
    }
    this.state = 'start';
    this.data = byte;
  }
  /**
   * Returns current state.
   */
  public getState(): State {
    return this.state;
  }
}
