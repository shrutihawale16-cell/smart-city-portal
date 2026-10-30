from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import sqlite3
import uuid
import random

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'smartcity.db')
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__)
CORS(app)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}


def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        conn.execute('''CREATE TABLE IF NOT EXISTS complaints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            complaint_id TEXT UNIQUE NOT NULL,
            category TEXT NOT NULL,
            location TEXT NOT NULL,
            description TEXT NOT NULL,
            status TEXT DEFAULT 'Submitted',
            photo TEXT,
            citizen_email TEXT,
            assigned_worker TEXT,
            completion_photo TEXT
        )''')
        conn.execute('''CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'Citizen'
        )''')
        conn.execute('''CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            worker_email TEXT NOT NULL,
            complaint_id TEXT NOT NULL,
            message TEXT NOT NULL,
            is_read INTEGER DEFAULT 0
        )''')
        columns = {row['name'] for row in conn.execute('PRAGMA table_info(complaints)')}
        for column in ('photo', 'citizen_email', 'assigned_worker', 'completion_photo'):
            if column not in columns:
                conn.execute(f'ALTER TABLE complaints ADD COLUMN {column} TEXT')

        defaults = [
            ('Smart City Admin', 'admin@smartcity.com', 'admin123', 'Admin'),
            ('Smart City Citizen', 'citizen@smartcity.com', 'citizen123', 'Citizen'),
            ('Municipal Officer 1', 'officer1@smartcity.com', 'officer1@123', 'Municipal Officer'),
            ('Municipal Officer 2', 'officer2@smartcity.com', 'officer2@456', 'Municipal Officer'),
            ('Municipal Officer 3', 'officer3@smartcity.com', 'officer3@789', 'Municipal Officer'),
            ('Municipal Officer 4', 'officer4@smartcity.com', 'officer4@321', 'Municipal Officer'),
            ('Worker 1', 'worker1@smartcity.com', 'worker1@123', 'Worker'),
            ('Worker 2', 'worker2@smartcity.com', 'worker2@456', 'Worker'),
            ('Worker 3', 'worker3@smartcity.com', 'worker3@789', 'Worker'),
            ('Worker 4', 'worker4@smartcity.com', 'worker4@321', 'Worker'),
            ('Worker 5', 'worker5@smartcity.com', 'worker5@654', 'Worker'),
        ]
        conn.executemany('''INSERT OR IGNORE INTO users (name,email,password,role)
                            VALUES (?,?,?,?)''', defaults)


def save_photo(file):
    if not file or not file.filename:
        return None
    original = secure_filename(file.filename)
    if '.' not in original or original.rsplit('.', 1)[1].lower() not in ALLOWED_EXTENSIONS:
        return None
    filename = f'{uuid.uuid4().hex}_{original}'
    file.save(os.path.join(UPLOAD_FOLDER, filename))
    return filename


def notify(conn, email, complaint_id, message):
    if email:
        conn.execute('''INSERT INTO notifications (worker_email, complaint_id, message)
                        VALUES (?,?,?)''', (email, complaint_id, message))


@app.route('/')
def home():
    return 'Smart City Backend is Running!'


@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}
    name, email, password = data.get('name'), data.get('email'), data.get('password')
    if not all((name, email, password)):
        return jsonify(message='Please fill all fields.'), 400
    with get_db() as conn:
        if conn.execute('SELECT id FROM users WHERE email=?', (email,)).fetchone():
            return jsonify(message='An account with this email already exists.'), 409
        conn.execute('INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)',
                     (name, email, password, 'Citizen'))
    return jsonify(message='Account created successfully.'), 201


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    email, password = data.get('email'), data.get('password')
    if not email or not password:
        return jsonify(message='Email and password are required'), 400
    with get_db() as conn:
        user = conn.execute('''SELECT id,name,email,role FROM users
                               WHERE email=? AND password=?''', (email, password)).fetchone()
    if user:
        return jsonify(message='Login successful', user=dict(user)), 200
    return jsonify(message='Invalid email or password'), 401


@app.route('/api/workers')
def get_workers():
    with get_db() as conn:
        rows = conn.execute("SELECT id,name,email,role FROM users WHERE role='Worker'").fetchall()
    return jsonify([dict(r) for r in rows]), 200


@app.route('/api/users')
def get_all_users():
    with get_db() as conn:
        rows = conn.execute('SELECT id,name,email,role FROM users ORDER BY id DESC').fetchall()
    return jsonify([dict(r) for r in rows]), 200


@app.route('/api/notifications')
def get_notifications():
    email = request.args.get('email')
    if not email:
        return jsonify(message='Email is required'), 400
    with get_db() as conn:
        rows = conn.execute('''SELECT * FROM notifications WHERE worker_email=?
                               ORDER BY id DESC''', (email,)).fetchall()
    return jsonify([dict(r) for r in rows]), 200


@app.route('/api/notifications/unread-count')
def get_unread_notification_count():
    email = request.args.get('email')
    if not email:
        return jsonify(message='Email is required'), 400
    with get_db() as conn:
        count = conn.execute('''SELECT COUNT(*) AS unread_count FROM notifications
                                WHERE worker_email=? AND is_read=0''', (email,)).fetchone()['unread_count']
    return jsonify(unread_count=count), 200


@app.route('/api/notifications/<int:notification_id>/read', methods=['PUT'])
def mark_notification_as_read(notification_id):
    with get_db() as conn:
        cursor = conn.execute('UPDATE notifications SET is_read=1 WHERE id=?', (notification_id,))
        if cursor.rowcount == 0:
            return jsonify(message='Notification not found'), 404
    return jsonify(message='Notification marked as read'), 200


@app.route('/api/complaints', methods=['POST'])
def create_complaint():
    category = request.form.get('category')
    location = request.form.get('location')
    description = request.form.get('description')
    citizen_email = request.form.get('citizen_email')
    if not all((category, location, description)):
        return jsonify(message='Please fill all complaint fields.'), 400
    photo_filename = save_photo(request.files.get('photo'))
    if not photo_filename:
        return jsonify(message='A JPG, PNG or WEBP photo is required.'), 400

    with get_db() as conn:
        for _ in range(20):
            complaint_id = 'CMP-' + str(random.randint(1000, 9999))
            if not conn.execute('SELECT id FROM complaints WHERE complaint_id=?', (complaint_id,)).fetchone():
                break
        else:
            complaint_id = 'CMP-' + uuid.uuid4().hex[:8].upper()
        conn.execute('''INSERT INTO complaints
                        (complaint_id,category,location,description,photo,citizen_email)
                        VALUES (?,?,?,?,?,?)''',
                     (complaint_id, category, location, description, photo_filename, citizen_email))
        officers = conn.execute("SELECT email FROM users WHERE role='Municipal Officer'").fetchall()
        for officer in officers:
            notify(conn, officer['email'], complaint_id,
                   f'New complaint {complaint_id} has been submitted by a citizen.')
    return jsonify(message='Complaint submitted successfully', complaint_id=complaint_id,
                   status='Submitted', photo=photo_filename), 201


@app.route('/api/complaints', methods=['GET'])
def get_complaints():
    with get_db() as conn:
        rows = conn.execute('SELECT * FROM complaints ORDER BY id DESC').fetchall()
    return jsonify([dict(r) for r in rows]), 200


@app.route('/api/my-complaints')
def get_my_complaints():
    email = request.args.get('email')
    if not email:
        return jsonify(message='Email is required.'), 400
    with get_db() as conn:
        rows = conn.execute('''SELECT * FROM complaints WHERE citizen_email=?
                               ORDER BY id DESC''', (email,)).fetchall()
    return jsonify([dict(r) for r in rows]), 200


@app.route('/api/dashboard-stats')
def dashboard_stats():
    with get_db() as conn:
        total = conn.execute('SELECT COUNT(*) AS n FROM complaints').fetchone()['n']
        resolved = conn.execute("SELECT COUNT(*) AS n FROM complaints WHERE status='Resolved'").fetchone()['n']
        citizens = conn.execute("SELECT COUNT(*) AS n FROM users WHERE role='Citizen'").fetchone()['n']
    return jsonify(citizens=citizens, total_complaints=total, resolved=resolved,
                   pending=total-resolved), 200


@app.route('/api/complaints/<complaint_id>/status', methods=['PUT'])
def update_status(complaint_id):
    data = request.get_json(silent=True) or {}
    status = data.get('status')
    if status not in ('Submitted', 'Under Review', 'Assigned', 'Resolved'):
        return jsonify(message='Invalid status'), 400
    with get_db() as conn:
        complaint = conn.execute('SELECT * FROM complaints WHERE complaint_id=?', (complaint_id,)).fetchone()
        if not complaint:
            return jsonify(message='Complaint not found'), 404
        if status == 'Resolved' and not complaint['completion_photo']:
            return jsonify(message='Worker must upload a completion photo before resolving.'), 400
        conn.execute('UPDATE complaints SET status=? WHERE complaint_id=?', (status, complaint_id))
        updated = conn.execute('SELECT * FROM complaints WHERE complaint_id=?', (complaint_id,)).fetchone()
    return jsonify(dict(updated)), 200


@app.route('/api/complaints/<complaint_id>/assign', methods=['PUT'])
def assign_complaint(complaint_id):
    data = request.get_json(silent=True) or {}
    worker_email = data.get('worker_email')
    if not worker_email:
        return jsonify(message='Worker email is required'), 400
    with get_db() as conn:
        complaint = conn.execute('SELECT * FROM complaints WHERE complaint_id=?', (complaint_id,)).fetchone()
        if not complaint:
            return jsonify(message='Complaint not found'), 404
        worker = conn.execute("SELECT id FROM users WHERE email=? AND role='Worker'", (worker_email,)).fetchone()
        if not worker:
            return jsonify(message='Worker not found'), 404
        conn.execute('''UPDATE complaints SET assigned_worker=?, status='Assigned'
                        WHERE complaint_id=?''', (worker_email, complaint_id))
        notify(conn, worker_email, complaint_id,
               f'New complaint {complaint_id} has been assigned to you.')
        updated = conn.execute('SELECT * FROM complaints WHERE complaint_id=?', (complaint_id,)).fetchone()
    return jsonify(dict(updated)), 200


@app.route('/api/worker-complaints')
def get_worker_complaints():
    email = request.args.get('email')
    if not email:
        return jsonify(message='Worker email is required'), 400
    with get_db() as conn:
        rows = conn.execute('''SELECT * FROM complaints WHERE assigned_worker=?
                               ORDER BY id DESC''', (email,)).fetchall()
    return jsonify([dict(r) for r in rows]), 200


@app.route('/api/complaints/<complaint_id>/complete', methods=['POST'])
def complete_complaint(complaint_id):
    worker_email = request.form.get('worker_email')
    if not worker_email:
        return jsonify(message='Worker email is required'), 400
    photo = request.files.get('completion_photo')
    if not photo or not photo.filename:
        return jsonify(message='Completion photo is required'), 400
    with get_db() as conn:
        complaint = conn.execute('SELECT * FROM complaints WHERE complaint_id=?', (complaint_id,)).fetchone()
        if not complaint:
            return jsonify(message='Complaint not found'), 404
        if complaint['assigned_worker'] != worker_email:
            return jsonify(message='This complaint is not assigned to this worker'), 403
        if complaint['status'] != 'Assigned':
            return jsonify(message='Only assigned complaints can be completed'), 400
        filename = save_photo(photo)
        if not filename:
            return jsonify(message='Upload a JPG, PNG or WEBP completion photo'), 400
        conn.execute('''UPDATE complaints SET completion_photo=?, status='Resolved'
                        WHERE complaint_id=?''', (filename, complaint_id))
        message = f'Complaint {complaint_id} has been resolved. Completion photo is available.'
        notify(conn, complaint['citizen_email'], complaint_id, message)
        officers = conn.execute("SELECT email FROM users WHERE role='Municipal Officer'").fetchall()
        for officer in officers:
            notify(conn, officer['email'], complaint_id, message)
        updated = conn.execute('SELECT * FROM complaints WHERE complaint_id=?', (complaint_id,)).fetchone()
    return jsonify(dict(updated)), 200


@app.route('/api/complaints/<complaint_id>', methods=['GET'])
def track_complaint(complaint_id):
    with get_db() as conn:
        complaint = conn.execute('SELECT * FROM complaints WHERE complaint_id=?', (complaint_id,)).fetchone()
    if not complaint:
        return jsonify(message='Complaint not found'), 404
    return jsonify(dict(complaint)), 200


if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
