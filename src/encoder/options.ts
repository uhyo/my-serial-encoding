/**
 * Options for encoder.
 * @package
 */
export interface EncoderOptions {
  /**
   * Number of bits of data.
   * Should be an integer between 0 and 52.
   */
  bits: number;
  /**
   * Order of bits.
   */
  order: 'MtL' | 'LtM';
  /**
   * Parity mode.
   */
  parity: 0 | 1 | null;
}

/**
 * Default values of options.
 * @package
 */
export const defaultOptions: EncoderOptions = {
  bits: 8,
  order: 'LtM',
  parity: 0,
};

/**
 * Validate given options and throws an error if invalid.
 * @package
 */
export function validateOptions(opts: EncoderOptions) {
  const { bits } = opts;
  if (!Number.isInteger(bits) || bits < 0 || 53 < bits) {
    throw new RangeError('Number of bits is out of range');
  }
}
