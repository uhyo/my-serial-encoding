import { Encoder } from '../src';

describe('Encoding', () => {
  test('initial state is idle', () => {
    const encoder = new Encoder();

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
