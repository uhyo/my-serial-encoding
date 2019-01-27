/**
 * Type of results stored in queue.
 * @package
 */
export type PendingData<T> =
  | {
      type: 'data';
      data: T;
    }
  | {
      type: 'error';
      error: unknown;
    };
