/**
 * Banker's queue
 */
export class Queue<T> {
  private readQueue: T[] = [];
  private writeQueue: T[] = [];

  public push(value: T): void {
    this.writeQueue.push(value);
  }
  public pop(): T | undefined {
    if (this.readQueue.length > 0) {
      return this.readQueue.pop();
    }
    this.readQueue = this.writeQueue;
    this.readQueue.reverse();
    this.writeQueue = [];
    return this.readQueue.pop();
  }
  public clear(): void {
    this.readQueue = [];
    this.writeQueue = [];
  }
  public get length(): number {
    return this.readQueue.length + this.writeQueue.length;
  }
}
