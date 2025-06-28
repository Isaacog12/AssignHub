const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = 3000;

// === Middleware ===
app.use(cors());
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/admin", express.static("admin"));
app.use("/uploads", express.static("uploads"));

// === SQLite Database Setup ===
const DB_PATH = path.join(__dirname, "uploads", "assignments.db");
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      subject TEXT,
      description TEXT,
      file TEXT,
      uploadedAt TEXT
    )
  `);
});

// === Multer Setup ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// === POST /upload ===
app.post("/upload", upload.single("file"), (req, res) => {
  const { title, subject, description } = req.body;
  const file = req.file;

  if (!file) return res.status(400).json({ message: "File is required." });

  const filePath = `/uploads/${file.filename}`;
  const uploadedAt = new Date().toISOString();

  db.run(
    "INSERT INTO assignments (title, subject, description, file, uploadedAt) VALUES (?, ?, ?, ?, ?)",
    [title, subject, description, filePath, uploadedAt],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error." });
      }
      res.json({ message: "Assignment uploaded successfully!" });
    }
  );
});

// === GET /assignments ===
app.get("/assignments", (req, res) => {
  db.all("SELECT * FROM assignments ORDER BY id DESC", (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to fetch assignments." });
    }
    res.json(rows);
  });
});

// === PUT /assignments/:id ===
app.put("/assignments/:id", (req, res) => {
  const { id } = req.params;
  const { title, subject, description } = req.body;

  db.run(
    "UPDATE assignments SET title = ?, subject = ?, description = ? WHERE id = ?",
    [title, subject, description, id],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to update assignment." });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: "Assignment not found." });
      }
      res.json({ message: "Assignment updated successfully." });
    }
  );
});

// === DELETE /assignments/:id ===
app.delete("/assignments/:id", (req, res) => {
  const { id } = req.params;

  // Get the file path to delete it
  db.get("SELECT file FROM assignments WHERE id = ?", [id], (err, row) => {
    if (err || !row) {
      return res.status(404).json({ message: "Assignment not found." });
    }

    const filePath = path.join(__dirname, row.file);

    db.run("DELETE FROM assignments WHERE id = ?", [id], function (err) {
      if (err) {
        return res.status(500).json({ message: "Failed to delete assignment." });
      }

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      res.json({ message: "Assignment deleted successfully." });
    });
  });
});

// === Start Server ===
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ AssignHub running at http://localhost:${PORT}`);
});