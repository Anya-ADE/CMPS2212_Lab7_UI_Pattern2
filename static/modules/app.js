import { emitter } from "./modules/event-emitter.js";
import { state } from "./state.js";
import { DataService } from "./modules/data-service.js";
import { render } from "./render.js";

emitter.on("registration:dispatch", (payload) => {
  DataService.createRegistration(payload);
});

emitter.on("registration:success", (reg) => {
  state.submitting = false;
  state.confirmation = reg;
  state.error = null;
  render();
});

emitter.on("registration:error", () => {
  state.submitting = false;
  render();
});

// Boot
render();