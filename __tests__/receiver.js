import { Receiver, Decoder } from '../src';

describe('Receiver', () => {
  let decoder, channel, driver;
  beforeEach(() => {
    decoder = new Decoder({
      bits: 8,
      order: 'LtM',
      parity: 0,
    });
    [channel, driver] = makeTestChannel();
  });
  test('start/stop (un)registers tick callback', () => {
    const receiver = new Receiver(channel, decoder);
    receiver.start();
    expect(driver.getCallback()).toEqual(expect.any(Function));
    receiver.stop();
    expect(driver.getCallback()).toBeNull();
  });
  test('receives asynchronously written data', async () => {
    const receiver = new Receiver(channel, decoder);
    receiver.start();
    driver.asyncWrite(
      [].concat(
        [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1],
        [0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 1],
      ),
    );
    const iter = receiver.iterateData();
    await expect(iter.next()).resolves.toEqual({
      value: 0b11110000,
      done: false,
    });
    await expect(iter.next()).resolves.toEqual({
      value: 0b11001011,
      done: false,
    });
  });
  test('receives synchronously written data', async () => {
    const receiver = new Receiver(channel, decoder);
    receiver.start();
    driver.write(
      [].concat(
        [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1],
        [0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 1],
        [0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 1],
      ),
    );
    const iter = receiver.iterateData();
    await expect(iter.next()).resolves.toEqual({
      value: 0b11110000,
      done: false,
    });
    await expect(iter.next()).resolves.toEqual({
      value: 0b11001011,
      done: false,
    });
    await expect(iter.next()).resolves.toEqual({
      value: 0b11100111,
      done: false,
    });
  });
  test('rejects on error data', async () => {
    const receiver = new Receiver(channel, decoder);
    receiver.start();
    driver.write(
      // parity error
      [0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1],
    );
    const iter = receiver.iterateData();
    await expect(iter.next()).rejects.toEqual({
      type: 'parity',
    });
  });
  test('rejects on error data after correct data', async () => {
    const receiver = new Receiver(channel, decoder);
    receiver.start();
    driver.write(
      [].concat(
        [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1],
        // parity error
        [0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1],
      ),
    );
    const iter = receiver.iterateData();
    await expect(iter.next()).resolves.toEqual({
      value: 0b11110000,
      done: false,
    });
    await expect(iter.next()).rejects.toEqual({
      type: 'parity',
    });
  });
  test('resets internal state', async () => {
    const receiver = new Receiver(channel, decoder);
    receiver.start();
    await driver.asyncWrite([0, 0, 0, 0, 0]);
    receiver.reset();
    driver.write(
      [].concat(
        [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1],
        [0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 1],
      ),
    );
    const iter = receiver.iterateData();
    await expect(iter.next()).resolves.toEqual({
      value: 0b11110000,
      done: false,
    });
    await expect(iter.next()).resolves.toEqual({
      value: 0b11001100,
      done: false,
    });
  });
  test('does not resolve until receiving data', async () => {
    const receiver = new Receiver(channel, decoder);
    receiver.start();
    const fn = jest.fn();
    receiver
      .iterateData()
      .next()
      .then(fn);
    await driver.asyncWrite([0, 0, 0, 0, 0, 1, 1, 1, 1, 0]);
    expect(fn).not.toBeCalled();
    await driver.asyncWrite([1]);
    expect(fn).toBeCalled();
  });
});

function makeTestChannel() {
  let callback = null;
  const channel = {
    registerTickCallback(fn) {
      callback = fn;
    },
    unregisterTickCallback(fn) {
      callback = null;
    },
  };
  const driver = {
    getCallback() {
      return callback;
    },
    async write(bits) {
      await null;
      for (const bit of bits) {
        callback(bit);
      }
    },
    async asyncWrite(bits) {
      for (const bit of bits) {
        await null;
        callback(bit);
      }
    },
  };
  return [channel, driver];
}
