import { Decoder } from '../src';

describe('Decoder', () => {
  test('initial state is idle', () => {
    const decoder = new Decoder();
    expect(decoder.getState()).toBe('idle');
  });
  test('still idle after receiving an idle bit', () => {
    const decoder = new Decoder();
    decoder.tick(1);
    expect(decoder.getState()).toBe('idle');
  });
  test('state changes to start when start bit is received', () => {
    const decoder = new Decoder();
    decoder.tick(0);
    expect(decoder.getState()).toBe('start');
  });
  test('state changes to data after receiving first data bit', () => {
    const decoder = new Decoder();
    decoder.tick(0); // start bit
    decoder.tick(1); // first data
    expect(decoder.getState()).toBe('data');
  });
  test('state changes to parity after receiving all data', () => {
    const decoder = new Decoder();
    writeAll(decoder, [
      0, // start bit
      1,
      1,
      0,
      1,
      0,
      0,
      1,
      1, // 8 bit data
    ]);
    expect(decoder.getState()).toBe('parity');
  });
  test('state changes to end after receiving parity bit', () => {
    const decoder = new Decoder();
    writeAll(decoder, [
      0, // start bit
      0,
      1,
      1,
      1,
      0,
      1,
      0,
      1, // 8 bit data
      1, // correct parity bit
    ]);
    expect(decoder.getState()).toBe('end');
  });
  test('data is correct when state is end', () => {
    const decoder = new Decoder();
    writeAll(decoder, [
      0, // start bit
      0,
      1,
      1,
      1,
      0,
      1,
      0,
      1, // 8 bit data
      1, // correct parity bit
    ]);
    expect(decoder.data).toBe(0b10101110);
  });
});

/**
 * Write all bits to decoder.
 */
function writeAll(decoder, bits) {
  bits.forEach(bit => decoder.tick(bit));
}
