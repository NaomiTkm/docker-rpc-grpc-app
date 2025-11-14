import express from "express";
const app = express();
app.use(express.json());

function tryBase64Decode(data) {
  // Decode, then re-encode to validate (ignoring padding differences)
  const buf = Buffer.from(String(data || ""), "base64");
  const re = buf.toString("base64").replace(/=+$/,"");
  const norm = String(data || "").replace(/[\r\n\s]+/g, "").replace(/=+$/,"");
  if (re !== norm) throw new Error("Invalid base64");
  return buf.toString("utf8");
}

app.post("/decode", (req, res) => {
  try {
    const { data = "" } = req.body || {};
    const decoded = tryBase64Decode(data);
    res.json({ decoded });
  } catch {
    res.status(400).json({ error: "Invalid base64 input" });
  }
});

//const PORT = process.env.PORT || 3002;
//app.listen(PORT, () => console.log(`[rpc-decode] listening on :${PORT}`));
const PORT = process.env.PORT || 3002;
const HOST = "0.0.0.0";
app.listen(PORT, HOST, () => console.log(`[rpc-decode] listening on ${HOST}:${PORT}`));