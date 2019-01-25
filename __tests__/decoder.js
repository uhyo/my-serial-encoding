import { Decoder } from '../src';

describe('Decoder', () => {
  describe('normal behavior', () => {
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
    test('state changes to stop after receiving parity bit', () => {
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
      expect(decoder.getState()).toBe('stop');
    });
    test('data is correct when state is stop', () => {
      const decoder = new Decoder();
      writeAll(decoder, [
        0, // start bit
        0, // 8 bit data
        1,
        1,
        1,
        0,
        1,
        0,
        1,
        1, // correct parity bit
      ]);
      expect(decoder.data).toBe(0b10101110);
    });
    test('state is end after receiving stop bit', () => {
      const decoder = new Decoder();
      writeAll(decoder, [
        0, // start bit
        0, // 8 bit data
        1,
        1,
        1,
        0,
        1,
        0,
        1,
        1, // correct parity bit
        1, // stop bit
      ]);
      expect(decoder.getState()).toBe('end');
      expect(decoder.data).toBe(0b10101110);
    });
    test('goes back to idle state', () => {
      const decoder = new Decoder();
      writeAll(decoder, [
        0, // start bit
        0, // 8 bit data
        1,
        1,
        1,
        0,
        1,
        0,
        1,
        1, // correct parity bit
        1, // stop bit
        1, // idle bit
      ]);
      expect(decoder.getState()).toBe('idle');
    });
    test('can receive new start bit at the end state', () => {
      const decoder = new Decoder();
      writeAll(decoder, [
        0, // start bit
        0, // 8 bit data
        1,
        1,
        1,
        0,
        1,
        0,
        1,
        1, // correct parity bit
        1, // stop bit
        0, // next start
      ]);
      expect(decoder.getState()).toBe('start');
    });
    test('can receive multiple data', () => {
      const decoder = new Decoder();
      writeAll(decoder, [
        0, // start bit
        0, // 8 bit data
        1,
        1,
        1,
        0,
        1,
        0,
        1,
        1, // correct parity bit
        1, // stop bit
      ]);
      expect(decoder.data).toBe(0b10101110);
      writeAll(decoder, [
        0, // start bit
        0, // 8 bit data
        0,
        0,
        0,
        1,
        1,
        0,
        0,
        0, // correct parity bit
        1, // stop bit
      ]);
      expect(decoder.getState()).toBe('end');
      expect(decoder.data).toBe(0b00110000);
      writeAll(decoder, [
        1, // idle bits
        1,
        0, // start bit
        1, // 8 bit data
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        0, // correct parity bit
        1, // stop bit
      ]);
      expect(decoder.getState()).toBe('end');
      expect(decoder.data).toBe(0b11111111);
    });
  });
  describe('abnormal behavior', () => {
    test('parity error', () => {
      const decoder = new Decoder();
      writeAll(decoder, [
        0, // start bit
        0, // 8 bit data
        1,
        1,
        1,
        0,
        1,
        0,
        1,
        0, // wrong parity bit
      ]);
      expect(decoder.getState()).toBe('error');
      expect(decoder.error).toStrictEqual({
        type: 'parity',
      });
    });
    test('keeps error state after receiving bits', () => {
      const decoder = new Decoder();
      writeAll(decoder, [
        0, // start bit
        0, // 8 bit data
        1,
        1,
        1,
        0,
        1,
        0,
        1,
        0, // wrong parity bit
        1, // other bits
        0,
        1,
      ]);
      expect(decoder.getState()).toBe('error');
      expect(decoder.error).toStrictEqual({
        type: 'parity',
      });
    });
    test('errors for wrong stop bit', () => {
      const decoder = new Decoder();
      writeAll(decoder, [
        0, // start bit
        0, // 8 bit data
        1,
        1,
        1,
        0,
        1,
        0,
        1,
        1, // parity bit
        0, // wrong stop bit
      ]);
      expect(decoder.getState()).toBe('error');
      expect(decoder.error).toStrictEqual({
        type: 'stopbit',
      });
    });
    test('goes back to idle by reset method', () => {
      const decoder = new Decoder();
      writeAll(decoder, [
        0, // start bit
        0, // 8 bit data
        1,
        1,
        1,
        0,
        1,
        0,
        1,
        1, // parity bit
        0, // wrong stop bit
      ]);
      decoder.reset();
      expect(decoder.getState()).toBe('idle');
    });
  });
});

/**
 * Write all bits to decoder.
 */
function writeAll(decoder, bits) {
  bits.forEach(bit => decoder.tick(bit));
}
