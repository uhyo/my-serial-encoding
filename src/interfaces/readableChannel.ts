/**
 * interface of readable channel.
 */
export interface IReadableChannel {
  /**
   * Register a callback called at each tick.
   */
  registerTickCallback(callback: (bit: 0 | 1) => void): void;
  /**
   * Remove registered tick callback.
   */
  unregisterTickCallback(): void;
}
