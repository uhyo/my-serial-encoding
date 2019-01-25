/**
 * Type of object which represents an error.
 */
export type ErrorObject =
  | {
      type: 'parity';
    }
  | {
      type: 'endbit';
    };
