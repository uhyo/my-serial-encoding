/**
 * interface of writable channel.
 */
export interface IWritableChannel {
  /**
   * Register a callback called at each tick.
   */
  registerTickCallback(callback: () => 0 | 1): void;
  /**
   * Remove registered tick callback.
   */
  unregisterTickCallback(): void;
}
