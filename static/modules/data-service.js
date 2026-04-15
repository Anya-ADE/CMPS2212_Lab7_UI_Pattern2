const BASE = 'http://localhost:4000/api';

export const DataService = {
  async registerEvent(payload) {
    try {
      const res = await fetch(`${BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const result = await res.json();
      console.log('Registration successful:', result);
    } catch (err) {
      console.error(`Error: ${err.message}`);
    }
  }
};