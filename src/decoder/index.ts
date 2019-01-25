import { EncodingOptions, defaultOptions, validateOptions } from '../options';
import { ErrorObject } from './error';

/**
 * State of decoder.
 */
export type State =
  | 'idle'
  | 'start'
  | 'data'
  | 'parity'
  | 'stop'
  | 'end'
  | 'error';

export class Decoder {
  private state: State = 'idle';
  private bitIndex: number = 0;
  private currentParity: 0 | 1 = 0;
  /**
   * Received data.
   */
  public data: number = 0;
  /**
   * Current error.
   */
  public error: ErrorObject | null = null;

  /**
   * Options given to this decoder.
   */
  public readonly options: Readonly<EncodingOptions>;

  /**
   * @param options options.
   */
  constructor(options?: Partial<EncodingOptions>) {
    const opts = {
      ...defaultOptions,
      ...options,
    };
    validateOptions(opts);
    this.options = opts;
  }

  /**
   * Reset to idle state.
   */
  public reset(): void {
    this.state = 'idle';
  }

  /**
   * Receive one bit.
   */
  public tick(bit: 0 | 1): void {
    switch (this.state) {
      case 'idle':
      case 'end': {
        if (bit === 1) {
          // received no data.
          this.state = 'idle';
        } else {
          // received a start bit.
          this.start();
        }
        break;
      }
      case 'start': {
        // received first bit of data.
        this.receiveBit(bit);
        this.state = 'data';
        break;
      }
      case 'data': {
        this.receiveBit(bit);
        break;
      }
      case 'parity': {
        // parity bit is received.
        const expectedParity = this.currentParity ^ this.options.parity!;
        if (bit === expectedParity) {
          // parity matches.
          this.state = 'stop';
        } else {
          this.state = 'error';
          this.error = {
            type: 'parity',
          };
        }
        break;
      }
      case 'stop': {
        // expects stop bit.
        if (bit === 1) {
          // correct
          this.state = 'end';
        } else {
          // error
          this.state = 'error';
          this.error = {
            type: 'stopbit',
          };
        }
        break;
      }
    }
  }
  /**
   * Initialize this decoder to receive new data.
   */
  private start() {
    this.state = 'start';
    this.bitIndex = 0;
    this.currentParity = 0;
    this.data = 0;
  }
  /**
   * Receive one bit of data.
   */
  private receiveBit(bit: 0 | 1) {
    if (bit === 1) {
      const factor =
        this.options.order === 'LtM'
          ? 2 ** this.bitIndex
          : 2 ** (this.options.bits - 1 - this.bitIndex);
      this.data += factor;
    }
    this.bitIndex++;
    this.currentParity ^= bit;
    if (this.bitIndex === this.options.bits) {
      // received all data.
      this.state = this.options.parity != null ? 'parity' : 'stop';
    }
  }

  /**
   * Returns current state.
   */
  public getState(): State {
    return this.state;
  }
}
