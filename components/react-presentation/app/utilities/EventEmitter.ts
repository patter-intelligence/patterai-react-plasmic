class EventEmitter {
  private listeners: { [event: string]: Array<(...args: any[]) => void> } = {};

  on(event: string, callback: (...args: any[]) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: (...args: any[]) => void) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event: string, ...args: any[]): boolean {
    if (!this.listeners[event]) return true;
    let shouldContinue = true;
    for (const callback of this.listeners[event]) {
      const result = callback(...args);
      if (result === false) {
        shouldContinue = false;
        break;
      }
    }
    return shouldContinue;
  }
}

export const eventEmitter = new EventEmitter();
