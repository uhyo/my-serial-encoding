import { Queue } from '../src/receiver/queue';

describe('Queue', () => {
  let queue;
  beforeEach(() => {
    queue = new Queue();
  });
  test('push and pop', () => {
    queue.push(123);
    expect(queue.pop()).toBe(123);
  });
  test('push push pop pop', () => {
    queue.push(123);
    queue.push(456);
    expect(queue.pop()).toBe(123);
    expect(queue.pop()).toBe(456);
  });
  test('returns undefined if no data', () => {
    expect(queue.pop()).toBeUndefined();
    queue.push(123);
    expect(queue.pop()).toBe(123);
    expect(queue.pop()).toBeUndefined();
  });
  test('returns correct length', () => {
    expect(queue.length).toBe(0);
    queue.push(123);
    queue.push(456);
    expect(queue.length).toBe(2);
    queue.pop();
    expect(queue.length).toBe(1);
    queue.push(123);
    queue.push(456);
    expect(queue.length).toBe(3);
    queue.pop();
    queue.pop();
    expect(queue.length).toBe(1);
  });
  test('clear', () => {
    queue.push(123);
    queue.push(456);
    expect(queue.length).toBe(2);
    queue.clear();
    expect(queue.length).toBe(0);
    expect(queue.pop()).toBeUndefined();
    queue.push(789);
    expect(queue.pop()).toBe(789);
  });
});
