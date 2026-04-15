import { emitter } from './emitter.js';
import { state } from './state.js';
import { render } from './render.js';
import { DataService } from './data-service.js';

emitter.on('users:formError', (msg) => {
  state.formError = msg;
  render(); 
});

emitter.on('users:submit', (payload) => {
  state.formError = null; 
  DataService.registerEvent(payload);
  render();
});

render();