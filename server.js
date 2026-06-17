const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ SUPABASE CONFIG
const supabase = createClient(
  "https://kvtlthrvpkcniupkoocj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dGx0aHJ2cGtjbml1cGtvb2NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE17..."
);

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
    `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}.json`
  );
}

// ✅ obtener todos
app.get("/reports", (req, res) => {
  let allReports = [];

  if (fs.existsSync(DATA_FOLDER)) {
    const files = fs.readdirSync(DATA_FOLDER);

    files.forEach(file => {
      const filePath = path.join(DATA_FOLDER, file);

      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath);

        if (content.length > 0) {
          const data = JSON.parse(content);
          allReports = allReports.concat(data);
        }
      }
    });
  }

  res.json(allReports);
});

// ✅ crear reporte
app.post("/reports", (req, res) => {
  const file = getTodayFile();
  let reports = [];

  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file);
    if (content.length > 0) {
      reports = JSON.parse(content);
    }
  }

  const newReport = {
    id: Date.now(),
    ...req.body
  };

  reports.push(newReport);
  fs.writeFileSync(file, JSON.stringify(reports, null, 2));

  res.json(newReport);
});

// ✅ actualizar
app.put("/reports/:id", (req, res) => {
  if (!fs.existsSync(DATA_FOLDER)) {
    return res.sendStatus(200);
  }

  const files = fs.readdirSync(DATA_FOLDER);

  files.forEach(file => {
    const filePath = path.join(DATA_FOLDER, file);

    if (fs.existsSync(filePath)) {
      let reports = JSON.parse(fs.readFileSync(filePath));

      reports = reports.map(r =>
        r.id == req.params.id ? { ...r, ...req.body } : r
      );

      fs.writeFileSync(filePath, JSON.stringify(reports, null, 2));
    }
  });

  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
``