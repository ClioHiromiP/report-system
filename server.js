const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FOLDER = path.join(__dirname, "data");
const REPORTS_CSV = path.join(DATA_FOLDER, "reports.csv");

if (!fs.existsSync(DATA_FOLDER)) {
  fs.mkdirSync(DATA_FOLDER, { recursive: true });
}

function quoteCsv(value) {
  if (value === undefined || value === null) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function writeCsv(reports) {
  const header = [
    "id",
    "title",
    "description",
    "priority",
    "assignedTo",
    "status",
    "createdAt",
    "resolvedAt",
    "actionTaken"
  ].join(",");

  const rows = reports.map(report => [
    report.id,
    report.title,
    report.description,
    report.priority,
    report.assignedTo,
    report.status,
    report.createdAt,
    report.resolvedAt || "",
    report.actionTaken || ""
  ].map(quoteCsv).join(","));

  fs.writeFileSync(REPORTS_CSV, [header, ...rows].join("\n"), "utf8");
}

function parseCsvLine(line) {
  const values = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          value += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        value += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        values.push(value);
        value = "";
      } else {
        value += char;
      }
    }
  }

  values.push(value);
  return values;
}

function readCsv() {
  if (!fs.existsSync(REPORTS_CSV)) return [];
  try {
    const content = fs.readFileSync(REPORTS_CSV, "utf8");
    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = parseCsvLine(lines[0]);
    return lines.slice(1).map(line => {
      const values = parseCsvLine(line);
      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index] || "";
      });
      if (record.id) record.id = Number(record.id);
      if (!record.priority) record.priority = "Media";
      if (!record.assignedTo) record.assignedTo = "Procesos";
      if (!record.status) record.status = "Pending";
      if (!record.createdAt) record.createdAt = new Date().toISOString();
      if (record.resolvedAt === "") delete record.resolvedAt;
      if (record.actionTaken === "") delete record.actionTaken;
      return record;
    });
  } catch (err) {
    console.error("Failed reading reports CSV:", err);
    return [];
  }
}

function readReports() {
  if (!fs.existsSync(REPORTS_CSV)) return [];
  return readCsv();
}

function saveReports(reports) {
  writeCsv(reports);
}

app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/reports", (req, res) => {
  const reports = readReports();
  res.json(reports);
});

app.get("/reports.csv", (req, res) => {
  if (!fs.existsSync(REPORTS_CSV)) {
    return res.status(404).send("CSV no disponible");
  }
  res.download(REPORTS_CSV, "reports.csv");
});

app.post("/reports", (req, res) => {
  const reports = readReports();
  const newReport = {
    id: Date.now(),
    ...req.body
  };

  reports.push(newReport);
  saveReports(reports);

  res.json(newReport);
});

app.put("/reports/:id", (req, res) => {
  const reports = readReports();
  const updated = reports.map(report =>
    report.id == req.params.id ? { ...report, ...req.body } : report
  );

  saveReports(updated);
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
  console.log("Reports CSV:", REPORTS_CSV);
});