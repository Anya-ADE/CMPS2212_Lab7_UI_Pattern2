package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

type Registration struct {
	Date    string `json:"date"`
	Tickets int    `json:"tickets"`
	Terms   bool   `json:"terms"`
}

type Response struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

func registerHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var reg Registration
	err := json.NewDecoder(r.Body).Decode(&reg)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	fmt.Printf("Received Registration: Date=%s, Tickets=%d, AcceptedTerms=%v\n", reg.Date, reg.Tickets, reg.Terms)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(Response{
		Status:  "success",
		Message: "Registration received successfully!",
	})
}

func main() {
	fs := http.FileServer(http.Dir("./"))
	http.Handle("/", fs)

	http.HandleFunc("/api/register", registerHandler)

	fmt.Println("Server starting at http://localhost:4000")
	log.Fatal(http.ListenAndServe(":4000", nil))
}
