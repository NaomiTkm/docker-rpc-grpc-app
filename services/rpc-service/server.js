import express from "express";
const app = express();
app.use(express.json());

app.post("/encode", (req, res) => {
  const { text = "" } = req.body || {};
  const encoded = Buffer.from(text, "utf8").toString("base64");
  res.json({ encoded });
});

//const PORT = process.env.PORT || 3001;
//app.listen(PORT, () => console.log(`[rpc] listening on :${PORT}`));
const PORT = process.env.PORT || 3001;
const HOST = "0.0.0.0";
app.listen(PORT, HOST, () => console.log(`[rpc] listening on ${HOST}:${PORT}`));