const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = 3000;

// === Middleware ===
app.use(cors());
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/admin", express.static("admin")); // Admin login/dashboard
app.use("/uploads", express.static("uploads")); // Serve uploaded files

// === Multer (file uploads) setup ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// === Metadata JSON ===
const METADATA_FILE = path.join(__dirname, "uploads", "metadata.json");
if (!fs.existsSync(METADATA_FILE)) fs.writeFileSync(METADATA_FILE, "[]");

// === POST /upload (Create) ===
app.post("/upload", upload.single("file"), (req, res) => {
  const { title, subject, description } = req.body;
  const file = req.file;

  if (!file) return res.status(400).json({ message: "File is required." });

  const newEntry = {
    title,
    subject,
    description,
    file: `/uploads/${file.filename}`,
    uploadedAt: new Date().toISOString()
  };

  const data = JSON.parse(fs.readFileSync(METADATA_FILE));
  data.push(newEntry);
  fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2));

  res.json({ message: "Assignment uploaded successfully!" });
});

// === GET /assignments (Read) ===
app.get("/assignments", (req, res) => {
  const data = JSON.parse(fs.readFileSync(METADATA_FILE));
  res.json(data);
});

// === PUT /assignments/:filename (Update metadata) ===
app.put("/assignments/:filename", (req, res) => {
  const { filename } = req.params;
  const { title, subject, description } = req.body;

  let data = JSON.parse(fs.readFileSync(METADATA_FILE));
  let updated = false;

  data = data.map(item => {
    if (item.file.endsWith(filename)) {
      updated = true;
      return { ...item, title, subject, description };
    }
    return item;
  });

  if (!updated) {
    return res.status(404).json({ message: "Assignment not found." });
  }

  fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2));
  res.json({ message: "Assignment updated successfully." });
});

// === DELETE /assignments/:filename (Delete assignment) ===
app.delete("/assignments/:filename", (req, res) => {
  const { filename } = req.params;

  let data = JSON.parse(fs.readFileSync(METADATA_FILE));
  const assignment = data.find(a => a.file.endsWith(filename));

  if (!assignment) {
    return res.status(404).json({ message: "Assignment not found." });
  }

  data = data.filter(a => !a.file.endsWith(filename));
  fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2));

  const filePath = path.join(__dirname, "uploads", filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  res.json({ message: "Assignment deleted successfully." });
});

// === Start server ===
app.listen(PORT, () => {
  console.log(`✅ AssignHub server running at http://localhost:${PORT}`);
});
