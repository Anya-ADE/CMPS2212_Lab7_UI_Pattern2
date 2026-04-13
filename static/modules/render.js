import { state } from "./state.js";
import { emitter } from "./modules/event-emitter.js";

// ── Observer log ──────────────────────────────────────────────────────────────

const logLines = [];

function addLog(tag, tagClass, msg) {
  const ts = new Date().toLocaleTimeString("en-GB", { hour12: false });
  logLines.push({ ts, tag, tagClass, msg });
  refreshLog();
}

function refreshLog() {
  const el = document.querySelector(".log-entries");
  const cnt = document.querySelector(".log-count");
  if (!el) return;

  if (cnt) cnt.textContent = logLines.length;

  if (!logLines.length) {
    el.innerHTML = '<span class="log-empty">// no events fired yet</span>';
    return;
  }

  el.innerHTML = logLines
    .map(
      (l) =>
        `<div class="log-line">
      <span class="log-ts">${l.ts}</span>
      <span class="log-tag ${l.tagClass}">[${l.tag}]</span>
      <span class="log-msg">${l.msg}</span>
    </div>`,
    )
    .join("");

  el.scrollTop = el.scrollHeight;
}

emitter.on("registration:submit", (d) =>
  addLog("FORM", "tag-form", `submit — ${d.eventDate}, ${d.tickets} ticket(s)`),
);
emitter.on("registration:invalid", (d) =>
  addLog("VALIDATION", "tag-validation", d.message),
);
emitter.on("registration:pending", () =>
  addLog("API", "tag-api", "POST /api/registrations"),
);
emitter.on("registration:success", (d) => {
  addLog("LOGGER", "tag-logger", `registration #${d.id} saved`);
  addLog("BILLING", "tag-billing", `invoice queued — ${d.tickets} × $49.99`);
  addLog("EMAIL", "tag-email", `confirmation dispatched for ${d.eventDate}`);
});
emitter.on("registration:error", (d) =>
  addLog("ERROR", "tag-error", d.message),
);

// ── Validation ────────────────────────────────────────────────────────────────

function validate(eventDate, tickets, terms) {
  const errors = {};

  if (!eventDate) {
    errors.eventDate = "Date is required";
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(eventDate) <= today)
      errors.eventDate = "Must be a future date";
  }

  const n = parseInt(tickets, 10);
  if (isNaN(n) || n < 1 || n > 5) errors.tickets = "Must be between 1 and 5";

  if (!terms) errors.terms = "Required";

  return errors;
}

// ── Handlers ──────────────────────────────────────────────────────────────────

function handleSubmit(e) {
  e.preventDefault();

  const fd = new FormData(e.target);
  const eventDate = fd.get("eventDate");
  const tickets = fd.get("tickets");
  const terms = fd.get("terms") === "on";

  const errors = validate(eventDate, tickets, terms);

  if (Object.keys(errors).length > 0) {
    Object.entries(errors).forEach(([field, msg]) =>
      emitter.emit("registration:invalid", {
        field,
        message: `${field}: ${msg}`,
      }),
    );
    state.error = errors;
    state.confirmation = null;
    render();
    return;
  }

  state.error = null;
  emitter.emit("registration:submit", {
    eventDate,
    tickets: parseInt(tickets, 10),
  });
  emitter.emit("registration:pending");
  state.submitting = true;
  render();

  emitter.emit("registration:dispatch", {
    eventDate,
    tickets: parseInt(tickets, 10),
    terms,
  });
}

function handleReset() {
  state.confirmation = null;
  state.error = null;
  state.submitting = false;
  render();
}

// ── Templates ─────────────────────────────────────────────────────────────────

const checkIcon = `<svg viewBox="0 0 16 16" fill="none" stroke="#16A34A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 8 6.5 11.5 13 5"/></svg>`;

function renderForm() {
  const err = state.error || {};

  return `
    <div class="card form-card">
      <h2>Register for an event</h2>
      <p class="subtitle">Fill in the details below to secure your spot.</p>

      <form id="reg-form" class="ui-form" novalidate>

        <div class="field">
          <label for="f-date">Event date</label>
          <input
            id="f-date"
            class="ui-input${err.eventDate ? " error" : ""}"
            name="eventDate"
            type="date"
          />
          ${err.eventDate ? `<span class="field-error">${err.eventDate}</span>` : ""}
        </div>

        <div class="field">
          <label for="f-tickets">Number of tickets</label>
          <input
            id="f-tickets"
            class="ui-input${err.tickets ? " error" : ""}"
            name="tickets"
            type="number"
            min="1" max="5"
            placeholder="1 – 5"
          />
          ${err.tickets ? `<span class="field-error">${err.tickets}</span>` : ""}
        </div>

        <div class="field">
          <label class="ui-checkbox-row${err.terms ? " error" : ""}">
            <input type="checkbox" name="terms" />
            I agree to the <a href="#">Terms &amp; Conditions</a>
          </label>
          ${err.terms ? `<span class="field-error">You must accept the terms</span>` : ""}
        </div>

        <div class="divider"></div>

        <button class="ui-btn" type="submit"${state.submitting ? " disabled" : ""}>
          ${
            state.submitting
              ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> Submitting...`
              : "Submit registration"
          }
        </button>

      </form>
    </div>`;
}

function renderConfirmation(reg) {
  return `
    <div class="card confirm-card">
      <div class="confirm-header">
        <div class="confirm-icon">${checkIcon}</div>
        <div>
          <h2>Registration confirmed</h2>
          <p>You're all set. Check your email for details.</p>
        </div>
      </div>

      <div class="confirm-grid">
        <div class="confirm-cell">
          <span>Event date</span>
          <strong>${reg.eventDate}</strong>
        </div>
        <div class="confirm-cell">
          <span>Tickets</span>
          <strong>${reg.tickets}</strong>
        </div>
      </div>

      <div class="confirm-id">ref: #${reg.id}</div>

      <button class="link-btn" id="reset-btn">
        ← Register again
      </button>
    </div>`;
}

function renderLog() {
  return `
    <div class="card log-card">
      <div class="log-header">
        <h3>Observer log</h3>
        <span class="log-count">0</span>
      </div>
      <div class="log-entries">
        <span class="log-empty">// no events fired yet</span>
      </div>
    </div>`;
}

// ── Main render ───────────────────────────────────────────────────────────────

export function render() {
  const app = document.querySelector("#app");
  if (!app) return;

  app.innerHTML =
    (state.confirmation
      ? renderConfirmation(state.confirmation)
      : renderForm()) + renderLog();

  refreshLog();

  if (state.confirmation) {
    document
      .querySelector("#reset-btn")
      ?.addEventListener("click", handleReset);
  } else {
    document
      .querySelector("#reg-form")
      ?.addEventListener("submit", handleSubmit);
  }
}