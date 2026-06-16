const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const FILE = "./reports.json";

const getReports = () => {
  if (!fs.existsSync(FILE)) return [];
  return JSON.parse(fs.readFileSync(FILE));
};

const saveReports = (data) => {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
};

app.get("/reports", (req, res) => {
  res.json(getReports());
});

app.post("/reports", (req, res) => {
  const reports = getReports();
  const newReport = {
    id: Date.now(),
    ...req.body,
  };
  reports.push(newReport);
  saveReports(reports);
  res.json(newReport);
});

app.put("/reports/:id", (req, res) => {
  let reports = getReports();
  reports = reports.map((r) =>
    r.id == req.params.id ? { ...r, ...req.body } : r
  );
  saveReports(reports);
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
