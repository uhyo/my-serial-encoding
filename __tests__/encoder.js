import { Encoder } from '../src';

describe('Encoding', () => {
  test('initial state is idle', () => {
    const encoder = new Encoder();

    expect(encoder.getState()).toBe('idle');
  });
  test('emits idle bit for idle state', () => {
    const encoder = new Encoder();

    expect(encoder.tick()).toBe(1);
    expect(encoder.getState()).toBe('idle');
  });
  test('state changes to start when data is set', () => {
    const encoder = new Encoder();
    encoder.setData(0x80);

    expect(encoder.getState()).toBe('start');
  });
  test('emits data', () => {
    const encoder = new Encoder();
    encoder.setData(0b01011011);

    const outputs = getAllOutput(encoder);
    // 0 start bit
    // 11011010 data from LSB to MSB
    // 1 parity bit
    // 1 stop bit
    expect(outputs).toEqual([0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1]);
  });
  describe('options', () => {
    test('bit order option', () => {
      const encoder = new Encoder({
        order: 'MtL',
      });
      encoder.setData(0b01001101);
      const outputs = getAllOutput(encoder);
      expect(outputs).toEqual([0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1]);
    });
    test('bits option', () => {
      const encoder = new Encoder({
        bits: 36,
      });
      encoder.setData(0x5_de_ad_be_ef);
      const outputs = getAllOutput(encoder);
      expect(outputs).toEqual(
        [0].concat(
          [1, 1, 1, 1, 0, 1, 1, 1], // ef
          [0, 1, 1, 1, 1, 1, 0, 1], // be
          [1, 0, 1, 1, 0, 1, 0, 1], // ad
          [0, 1, 1, 1, 1, 0, 1, 1], // de
          [1, 0, 1, 0], // 5
          [0, 1],
        ),
      );
    });
    test('parity option (1)', () => {
      const encoder = new Encoder({
        parity: 1,
      });
      encoder.setData(0b01001101);
      const outputs = getAllOutput(encoder);
      expect(outputs).toEqual([0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1]);
    });
    test('parity option (null)', () => {
      const encoder = new Encoder({
        parity: null,
      });
      encoder.setData(0b01001101);
      const outputs = getAllOutput(encoder);
      expect(outputs).toEqual([0, 1, 0, 1, 1, 0, 0, 1, 0, 1]);
    });
  });
  describe('option validation', () => {
    it('throws for non-finite number of bits', () => {
      expect(() => {
        const _ = new Encoder({
          bits: Number.NaN,
        });
      }).toThrow();
    });
    it('throws for negative number of bits', () => {
      expect(() => {
        const _ = new Encoder({
          bits: -3,
        });
      }).toThrow();
    });
    it('throws for large number of bits', () => {
      expect(() => {
        const _ = new Encoder({
          bits: 54,
        });
      }).toThrow();
    });
    it('throws for non-integer number of bits', () => {
      expect(() => {
        const _ = new Encoder({
          bits: 8.5,
        });
      }).toThrow();
    });
  });
  describe('setData', () => {
    it('throws on out-of-range data', () => {
      const encoder = new Encoder({ bits: 5 });
      expect(() => encoder.setData(-100)).toThrow();
      expect(() => encoder.setData(32)).toThrow();
    });
    it('throws on non-finite data', () => {
      const encoder = new Encoder();
      expect(() => encoder.setData(Infinity)).toThrow();
    });
    it('throws on non-integer data', () => {
      const encoder = new Encoder();
      expect(() => encoder.setData(62.3)).toThrow();
    });
    it('throws during emission', () => {
      const encoder = new Encoder();
      encoder.setData(200);
      expect(() => encoder.setData(3)).toThrow();
    });
    it('throws before the end bit is emitted', () => {
      const encoder = new Encoder({
        bits: 2,
        parity: null,
      });
      encoder.setData(3);
      encoder.tick(); // start bit
      encoder.tick(); // data bit 1
      encoder.tick(); // data bit 2
      expect(encoder.getState()).toBe('end');
      expect(() => encoder.setData(0)).toThrow();
    });
    it('does not throw after the end bit is emitted', () => {
      const encoder = new Encoder({
        bits: 2,
        parity: null,
      });
      encoder.setData(3);
      encoder.tick(); // start bit
      encoder.tick(); // data bit 1
      encoder.tick(); // data bit 2
      encoder.tick(); // end bit
      expect(encoder.getState()).toBe('idle');
      encoder.setData(0);
      expect(encoder.getState()).toBe('start');
    });
  });
});

/**
 * Run Encoder until it reaches idle.
 */
function getAllOutput(encoder) {
  const result = [];
  do {
    result.push(encoder.tick());
  } while (encoder.getState() !== 'idle');
  return result;
}
