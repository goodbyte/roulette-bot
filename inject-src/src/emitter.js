class Emitter {
  constructor() {
    this.listeners = new Map();
  }

  on(eventName, callback) {
    const listeners = this.listeners.get(eventName);

    if (Array.isArray(listeners)) listeners.push(callback);
    else this.listeners.set(eventName, [callback]);
  }

  off(eventName, callback) {
    const listeners = this.listeners.get(eventName);
    if (!Array.isArray(listeners)) return;

    const index = listeners.indexOf(callback);
    if (index !== -1) listeners.splice(index, 1);
  }

  emit(eventName, ...args) {
    if (!this.listeners.has(eventName)) return;

    const listeners = this.listeners.get(eventName);
    listeners.forEach((listener) => listener(...args));
  }
}

module.exports = Emitter;