import { Encoder, Sender } from '../src';

describe('Sender', () => {
  let encoder, results, channel, driver;
  beforeEach(() => {
    encoder = new Encoder({
      order: 'LtM',
      bits: 8,
      parity: 0,
    });
    [results, channel, driver] = makeTestChannel();
  });
  test('start/stop (un)registers tick callback', () => {
    const sender = new Sender(channel, encoder);
    sender.start();
    expect(driver.getCallback()).toEqual(expect.any(Function));
    sender.stop();
    expect(driver.getCallback()).toBeNull();
  });
  test('writes idle bits when no data is stored', () => {
    const sender = new Sender(channel, encoder);
    sender.start();
    driver.time(5);
    expect(results).toEqual([1, 1, 1, 1, 1]);
  });
  test('writes all data to channel', () => {
    const sender = new Sender(channel, encoder);
    sender.start();
    sender.setData(new Uint8Array([0b11110000, 0b01001101, 0b01110110]));
    driver.time(11 * 3);
    expect(results).toEqual(
      [].concat(
        [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1],
        [0, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1],
        [0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1],
      ),
    );
  });
  test('writes idle after writing all data', () => {
    const sender = new Sender(channel, encoder);
    sender.start();
    sender.addData(new Uint8Array([0b00000010, 0b10000000]));
    driver.time(11 * 2 + 4);
    expect(results).toEqual(
      [].concat(
        [0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
        [1, 1, 1, 1],
      ),
    );
  });
  test('can set new data after idle', () => {
    const sender = new Sender(channel, encoder);
    sender.start();
    sender.addData(new Uint8Array([0b11111111]));
    driver.time(11 + 3);
    sender.setData(new Uint8Array([0b10101010]));
    driver.time(11 + 3);
    expect(results).toEqual(
      [].concat(
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
        [1, 1, 1],
        [0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 1, 1],
      ),
    );
  });
  test('can add data during write', () => {
    const sender = new Sender(channel, encoder);
    sender.start();
    sender.setData(new Uint8Array([0b11110000, 0b00001111]));
    driver.time(11 + 5);
    sender.addData(new Uint8Array([0b10101010]));
    driver.time(6 + 11 + 2);
    expect(results).toEqual(
      [].concat(
        [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1],
        [0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1],
        [0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 1],
      ),
    );
  });
  test('can add data when data remains', () => {
    const sender = new Sender(channel, encoder);
    sender.start();
    sender.setData(new Uint8Array([0b11110000, 0b00001111]));
    driver.time(2);
    sender.addData(new Uint8Array([0b10101010]));
    driver.time(9 + 11 * 2 + 2);
    expect(results).toEqual(
      [].concat(
        [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1],
        [0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1],
        [0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 1],
      ),
    );
  });
  test('can reset data during write', () => {
    const sender = new Sender(channel, encoder);
    sender.start();
    sender.setData(new Uint8Array([0b11110000, 0b00001111]));
    driver.time(8);
    sender.setData(new Uint8Array([0b00100101]));
    driver.time(3 + 11 + 2);
    expect(results).toEqual(
      [].concat(
        [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1],
        [0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1],
        [1, 1],
      ),
    );
  });
  test('can reset by passing empty data', () => {
    const sender = new Sender(channel, encoder);
    sender.start();
    sender.setData(new Uint8Array([0b00000000, 0b11111111]));
    driver.time(8);
    sender.setData(new Uint8Array([]));
    driver.time(3 + 5);
    expect(results).toEqual(
      [].concat([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 1, 1, 1, 1]),
    );
  });
  test('can reset by calling resetData', () => {
    const sender = new Sender(channel, encoder);
    sender.start();
    sender.setData(new Uint8Array([0b01101011, 0b00000000]));
    driver.time(8);
    sender.resetData();
    driver.time(3 + 5);
    expect(results).toEqual(
      [].concat([0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1], [1, 1, 1, 1, 1]),
    );
  });
});

/**
 * make writable channel for testing.
 */
function makeTestChannel() {
  const results = [];
  let callback = null;
  const writable = {
    registerTickCallback(f) {
      callback = f;
    },
    unregisterTickCallback() {
      callback = null;
    },
  };
  const driver = {
    time(num) {
      for (let i = 0; i < num; i++) {
        results.push(callback());
      }
    },
    getCallback() {
      return callback;
    },
  };
  return [results, writable, driver];
}
