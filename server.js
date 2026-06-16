const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ servir frontend
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const DATA_FOLDER = "./data";

// crear carpeta si no existe
if (!fs.existsSync(DATA_FOLDER)) {
  fs.mkdirSync(DATA_FOLDER);
}

// 📅 archivo por día
function getTodayFile() {
  const d = new Date();
  return path.join(
    DATA_FOLDER,
    `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}.json`
  );
}

// ✅ obtener todos
app.get("/reports", (req, res) => {

  let allReports = [];

  if (fs.existsSync(DATA_FOLDER)) {
    const files = fs.readdirSync(DATA_FOLDER);

    files.forEach(file => {
      const data = JSON.parse(
        fs.readFileSync(path.join(DATA_FOLDER, file))
      );
      allReports = allReports.concat(data);
    });
  }

  res.json(allReports);
});

// ✅ crear reporte
app.post("/reports", (req, res) => {

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

// ✅ actualizar (resolver / no resuelto)
app.put("/reports/:id", (req, res) => {
  const files = fs.readdirSync(DATA_FOLDER);

  files.forEach(file => {
    const filePath = path.join(DATA_FOLDER, file);
    let reports = JSON.parse(fs.readFileSync(filePath));

