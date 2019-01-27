import { Encoder, Sender } from '../src';

describe('Sender', () => {
  let encoder, results, channel, driver;
  beforeEach(() => {
    encoder = new Encoder();
    [results, channel, driver] = makeTestChannel();
  });
  test('writes idle bits when no data is stored', () => {
    const sender = new Sender(channel, encoder);
    sender.start();
    driver.time(5);
    expect(results).toEqual([1, 1, 1, 1, 1]);
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
  };
  return [results, writable, driver];
}
