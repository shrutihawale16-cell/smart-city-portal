from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import random

app = Flask(__name__)
CORS(app)


# Database connection
def get_db():
    conn = sqlite3.connect("smartcity.db")
    conn.row_factory = sqlite3.Row
    return conn


# Create complaints table
def init_db():
    conn = get_db()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS complaints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            complaint_id TEXT UNIQUE NOT NULL,
            category TEXT NOT NULL,
            location TEXT NOT NULL,
            description TEXT NOT NULL,
            status TEXT DEFAULT 'Submitted'
        )
    """)

    conn.commit()
    conn.close()


# Home
@app.route("/")
def home():
    return "Smart City Backend is Running!"


# Create Complaint
@app.route("/api/complaints", methods=["POST"])
def create_complaint():

    data = request.json

    complaint_id = "CMP-" + str(random.randint(1000, 9999))

    conn = get_db()

    conn.execute("""
        INSERT INTO complaints
        (complaint_id, category, location, description)
        VALUES (?, ?, ?, ?)
    """, (
        complaint_id,
        data["category"],
        data["location"],
        data["description"]
    ))

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Complaint submitted successfully",
        "complaint_id": complaint_id,
        "status": "Submitted"
    })


# Track Complaint
@app.route("/api/complaints/<complaint_id>", methods=["GET"])
def track_complaint(complaint_id):

    conn = get_db()

    complaint = conn.execute(
        "SELECT * FROM complaints WHERE complaint_id = ?",
        (complaint_id,)
    ).fetchone()

    conn.close()

    if complaint:
        return jsonify(dict(complaint))

    return jsonify({
        "message": "Complaint not found"
    }), 404


# Initialize database
init_db()


if __name__ == "__main__":
    app.run(debug=True)