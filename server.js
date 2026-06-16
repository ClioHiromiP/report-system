const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// 📁 folder where files will be stored
const DATA_FOLDER = "./data";

// create folder if it doesn't exist
if (!fs.existsSync(DATA_FOLDER)) {
  fs.mkdirSync(DATA_FOLDER);
}

// ⏱ 1 week
const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

// ✅ get today's file name (example: 6-16-26.json)
const getTodayFile = () => {
  const d = new Date();
  const name = `${d.getMonth()+1}-${d.getDate()}-${String(d.getFullYear()).slice(-2)}.json`;
  return path.join(DATA_FOLDER, name);
};

// ✅ read ALL reports from all files
const getAllReports = () => {
  const files = fs.readdirSync(DATA_FOLDER);
  let reports = [];

  files.forEach(file => {
    const filePath = path.join(DATA_FOLDER, file);
    const data = JSON.parse(fs.readFileSync(filePath));
    reports = reports.concat(data);
  });

  return reports;
};

// ✅ clean old files (older than 7 days)
const cleanOldFiles = () => {
  const files = fs.readdirSync(DATA_FOLDER);
  const now = Date.now();

  files.forEach(file => {
    const filePath = path.join(DATA_FOLDER, file);

    const stats = fs.statSync(filePath);
    const fileTime = stats.mtime.getTime();

    if (now - fileTime > ONE_WEEK) {
      fs.unlinkSync(filePath);
    }
  });
};

// ✅ GET reports
app.get("/reports", (req, res) => {
  cleanOldFiles();
  const reports = getAllReports();
  res.json(reports);
});

// ✅ POST new report
app.post("/reports", (req, res) => {
  cleanOldFiles();

  const file = getTodayFile();

  let reports = [];
  if (fs.existsSync(file)) {
    reports = JSON.parse(fs.readFileSync(file));
  }

  const newReport = {
    id: Date.now(),
    ...req.body
  };

  reports.push(newReport);
  fs.writeFileSync(file, JSON.stringify(reports, null, 2));

  res.json(newReport);
});

// ✅ UPDATE report
app.put("/reports/:id", (req, res) => {
  const files = fs.readdirSync(DATA_FOLDER);

  files.forEach(file => {
    const filePath = path.join(DATA_FOLDER, file);
    let reports = JSON.parse(fs.readFileSync(filePath));

    reports = reports.map(r =>
      r.id == req.params.id ? { ...r, ...req.body } : r
    );

    fs.writeFileSync(filePath, JSON.stringify(reports, null, 2));
  });

  res.sendStatus(200);
});

// ✅ PORT (Render compatible)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
