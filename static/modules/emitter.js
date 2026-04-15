const subscribers = {};

export const emitter = {
  on(event, callback) {
    if (!subscribers[event]) {
      subscribers[event] = [];
    }
    subscribers[event].push(callback);
  },

  emit(event, payload) {
    if (subscribers[event]) {
      subscribers[event].forEach((callback) => callback(payload));
    }
  }
};