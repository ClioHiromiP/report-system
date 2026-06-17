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
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dGx0aHJ2cGtjbml1cGtvb2NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MDEzMTIsImV4cCI6MjA5NzI3NzMxMn0.26UU5emj_hzxoZUhyJxr0DOEAE3refAJp7JbulQGyJU"
);

// ✅ servir frontend
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const DATA_FOLDER = "./data";
const LOCAL_REPORTS_FILE = path.join(__dirname, "reports.json");

if (!fs.existsSync(DATA_FOLDER)) {
  fs.mkdirSync(DATA_FOLDER);
}

function getTodayFile() {
  const d = new Date();
  return path.join(
    DATA_FOLDER,
    `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}.json`
  );
}

function readLocalReports() {
  if (!fs.existsSync(LOCAL_REPORTS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(LOCAL_REPORTS_FILE, "utf8"));
  } catch (err) {
    console.error("Failed reading local reports file:", err);
    return [];
  }
}

function saveLocalReport(report) {
  const reports = readLocalReports();
  reports.push(report);
  fs.writeFileSync(LOCAL_REPORTS_FILE, JSON.stringify(reports, null, 2));
}

// ✅ GET (CAMBIO: ahora desde Supabase, con fallback local)
app.get("/reports", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("createdAt", { ascending: true });

    if (error) {
      console.error("Supabase GET error:", error);
      return res.json(readLocalReports());
    }

    if (!Array.isArray(data)) {
      console.error("Supabase GET returned invalid data:", data);
      return res.json(readLocalReports());
    }

    return res.json(data);
  } catch (error) {
    console.error("Supabase GET exception:", error);
    return res.json(readLocalReports());
  }
});

// ✅ POST (CAMBIO IMPORTANTE: ahora guarda en Supabase, with local fallback)
app.post("/reports", async (req, res) => {
  const newReport = {
    id: Date.now(),
    ...req.body
  };

  res.json(newReport);
  saveLocalReport(newReport);

  try {
    const { error } = await supabase.from("reports").insert([newReport]);
    if (error) {
      console.error("Supabase POST error:", error);
    }
  } catch (err) {
    console.error("Supabase POST exception:", err);
  }
});

// ✅ UPDATE (dejas igual como lo tenías)
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