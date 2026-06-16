const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const FILE = "./reports.json";

// ⏱ 1 WEEK in milliseconds
const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

// ✅ Load reports and remove old ones
const getReports = () => {
  if (!fs.existsSync(FILE)) return [];

  const data = JSON.parse(fs.readFileSync(FILE));
  const now = Date.now();

  // Keep only reports from last 7 days
  return data.filter(r => {
    return new Date(r.createdAt).getTime() > now - ONE_WEEK;
  });
};

// ✅ Save reports
const saveReports = (data) => {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
};

// ✅ Get reports
app.get("/reports", (req, res) => {
  const freshReports = getReports();
  saveReports(freshReports); // clean automatically
  res.json(freshReports);
});

// ✅ Add report
app.post("/reports", (req, res) => {
  const reports = getReports();

  const newReport = {
    id: Date.now(),
    ...req.body
  };

  reports.push(newReport);
  saveReports(reports);

  res.json(newReport);
});

// ✅ Update report
app.put("/reports/:id", (req, res) => {
  let reports = getReports();

  reports = reports.map(r =>
    r.id == req.params.id ? { ...r, ...req.body } : r
  );

  saveReports(reports);
  res.sendStatus(200);
});

// ✅ Use dynamic port (Render compatible)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
