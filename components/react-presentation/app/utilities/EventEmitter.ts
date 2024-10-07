type EventCallback<T extends any[] = any[]> = (...args: T) => boolean | void;

class EventEmitter<EventMap extends Record<string, any[]> = Record<string, any[]>> {
  private listeners: Map<keyof EventMap, Set<EventCallback<any>>> = new Map();

  on<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return this;
  }

  once<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>): this {
    const onceWrapper = (...args: EventMap[K]) => {
      this.off(event, onceWrapper);
      return callback(...args);
    };
    return this.on(event, onceWrapper);
  }

  off<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>): this {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.listeners.delete(event);
      }
    }
    return this;
  }

  emit<K extends keyof EventMap>(event: K, ...args: EventMap[K]): boolean {
    const listeners = this.listeners.get(event);
    if (!listeners) return true;

    let shouldContinue = true;
    for (const callback of listeners) {
      const result = callback(...args);
      if (result === false) {
        shouldContinue = false;
        break;
      }
    }
    return shouldContinue;
  }

  removeAllListeners<K extends keyof EventMap>(event?: K): this {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
    return this;
  }
}

interface AppEventMap {
  'nextStep': [number, any]; // [currentStep, currentSlide]
  // Add other event types here
}

export const eventEmitter = new EventEmitter<AppEventMap>();
