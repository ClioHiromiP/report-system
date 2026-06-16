const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ SERVIR EL FRONTEND (ESTO ES LO QUE FALTABA)
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const DATA_FOLDER = "./data";

// crear carpeta si no existe
if (!fs.existsSync(DATA_FOLDER)) {
  fs.mkdirSync(DATA_FOLDER);
}

// ⏱ 7 días
const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

// 📅 archivo por día
function getTodayFile() {
  const d = new Date();
  return path.join(
    DATA_FOLDER,
    `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}.json`
  );
}

// ✅ eliminar archivos viejos
function cleanOldFiles() {
  if (!fs.existsSync(DATA_FOLDER)) return;

  const files = fs.readdirSync(DATA_FOLDER);
  const now = Date.now();

  files.forEach(file => {
    const filePath = path.join(DATA_FOLDER, file);
    const stats = fs.statSync(filePath);

    if (now - stats.mtimeMs > ONE_WEEK) {
      fs.unlinkSync(filePath);
    }
  });
}

// ✅ obtener todos
app.get("/reports", (req, res) => {
  cleanOldFiles();

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

// ✅ actualizar (resolver)
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
