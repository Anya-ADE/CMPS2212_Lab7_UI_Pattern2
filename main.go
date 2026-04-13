package main

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"sync"
	"time"
)

type Registration struct {
	ID        int    `json:"id"`
	EventDate string `json:"eventDate"`
	Tickets   int    `json:"tickets"`
	CreatedAt string `json:"createdAt"`
}

type application struct {
	logger        *slog.Logger
	mu            sync.Mutex
	registrations []Registration
	nextID        int
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func (app *application) createRegistration(w http.ResponseWriter, r *http.Request) {
	var input struct {
		EventDate string `json:"eventDate"`
		Tickets   int    `json:"tickets"`
		Terms     bool   `json:"terms"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	// Validate event date
	if input.EventDate == "" {
		writeError(w, http.StatusUnprocessableEntity, "eventDate is required")
		return
	}
	parsed, err := time.Parse("2006-01-02", input.EventDate)
	if err != nil {
		writeError(w, http.StatusUnprocessableEntity, "eventDate must be YYYY-MM-DD")
		return
	}
	today := time.Now().Truncate(24 * time.Hour)
	if !parsed.After(today) {
		writeError(w, http.StatusUnprocessableEntity, "eventDate must be a future date")
		return
	}

	// Validate tickets
	if input.Tickets < 1 || input.Tickets > 5 {
		writeError(w, http.StatusUnprocessableEntity, "tickets must be between 1 and 5")
		return
	}

	// Validate terms
	if !input.Terms {
		writeError(w, http.StatusUnprocessableEntity, "terms must be accepted")
		return
	}

	app.mu.Lock()
	app.nextID++
	reg := Registration{
		ID:        app.nextID,
		EventDate: input.EventDate,
		Tickets:   input.Tickets,
		CreatedAt: time.Now().Format(time.RFC3339),
	}
	app.registrations = append(app.registrations, reg)
	app.mu.Unlock()

	app.logger.Info("registration created",
		"id", reg.ID,
		"eventDate", reg.EventDate,
		"tickets", reg.Tickets,
	)

	writeJSON(w, http.StatusCreated, reg)
}

func (app *application) listRegistrations(w http.ResponseWriter, r *http.Request) {
	app.mu.Lock()
	regs := make([]Registration, len(app.registrations))
	copy(regs, app.registrations)
	app.mu.Unlock()

	writeJSON(w, http.StatusOK, regs)
}

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))

	app := &application{
		logger:        logger,
		registrations: []Registration{},
		nextID:        0,
	}

	mux := http.NewServeMux()

	// API routes
	mux.HandleFunc("POST /api/registrations", app.createRegistration)
	mux.HandleFunc("GET /api/registrations", app.listRegistrations)

	fs := http.FileServer(http.Dir("./static"))
	mux.Handle("/", fs)

	addr := ":4000"
	logger.Info("starting server", "addr", fmt.Sprintf("http://localhost%s", addr))

	err := http.ListenAndServe(addr, mux)
	logger.Error(err.Error())
	os.Exit(1)
}
