import express from "express";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

// ---- Config (inside Compose these point to service DNS names) ----
const RPC_URL         = process.env.RPC_URL         || "http://localhost:3001/encode";
const RPC_DECODE_URL  = process.env.RPC_DECODE_URL  || "http://localhost:3002/decode";
const GRPC_ADDR       = process.env.GRPC_ADDR       || "localhost:50051";
const GRPC_DECODE_ADDR= process.env.GRPC_DECODE_ADDR|| "localhost:50052";

// ---- Proto paths (keep copies in gateway/) ----
// const PROTO_PATH        = join(__dirname, "./encoder.proto"); // package encoder; service Encoder { Encode }
// const DECODE_PROTO_PATH = join(__dirname, "./decoder.proto"); // package decoder; service Decoder { Decode }
// const PROTO_PATH = join(__dirname, "../grpc-encode-service/encoder.proto");
// const DECODE_PROTO_PATH = join(__dirname, "../grpc-decode-service/decoder.proto");
const PROTO_PATH        = join(__dirname, "encoder.proto");
const DECODE_PROTO_PATH = join(__dirname, "decoder.proto");

// ---- gRPC clients ----
const encPkgDef = protoLoader.loadSync(PROTO_PATH, { longs: String, enums: String, defaults: true });
const encRoot   = grpc.loadPackageDefinition(encPkgDef);
const encSvc    = encRoot?.encoder?.Encoder;             // adjust if your encoder package differs
const grpcClient = encSvc ? new encSvc(GRPC_ADDR, grpc.credentials.createInsecure()) : null;

const decPkgDef = protoLoader.loadSync(DECODE_PROTO_PATH, { longs: String, enums: String, defaults: true });
const decRoot   = grpc.loadPackageDefinition(decPkgDef);
const decSvc    = decRoot?.decoder?.Decoder;             // package decoder; service Decoder
const grpcDecClient = new decSvc(GRPC_DECODE_ADDR, grpc.credentials.createInsecure());

// ---- time helper ----
const nsNow = () => process.hrtime.bigint();

// ---- RPC helpers (HTTP) ----
async function callRpc(text) {
  const r = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify({ text })
  });
  if (!r.ok) throw new Error(`RPC HTTP ${r.status}`);
  const j = await r.json();
  // Expecting { encoded: "<base64>" }
  return j.encoded ?? j.value ?? j.result;
}
async function rpcDecode(data) {
  const r = await fetch(RPC_DECODE_URL, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify({ data })
  });
  if (!r.ok) throw new Error(`RPC decode HTTP ${r.status}`);
  const j = await r.json();
  // Expecting { decoded: "<utf8>" }
  return j.decoded ?? j.text ?? j.result;
}

// ---- gRPC helpers ----
function callGrpc(text) {
  if (!grpcClient) throw new Error("gRPC encoder client not configured (missing encoder.proto?)");
  return new Promise((resolve, reject) => {
    grpcClient.Encode({ text }, (err, resp) => err ? reject(err) : resolve(resp.encoded ?? resp.value));
  });
}
function grpcDecode(data) {
  return new Promise((resolve, reject) => {
    grpcDecClient.Decode({ data }, (err, resp) => err ? reject(err) : resolve(resp.decoded));
  });
}

// ---- Simple API for the frontend ----
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.post("/api/encode", async (req, res) => {
  try {
    const mode = (req.body?.mode || "rpc").toLowerCase(); // "rpc" | "grpc"
    const text = req.body?.text ?? "";
    const t0 = Date.now();
    const encoded = (mode === "grpc") ? await callGrpc(text) : await callRpc(text);
    res.json({ value: encoded, ms: Date.now() - t0, mode });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.post("/api/decode", async (req, res) => {
  try {
    const mode = (req.body?.mode || "rpc").toLowerCase();
    const value = req.body?.value ?? req.body?.data ?? ""; // accept value|data
    const t0 = Date.now();
    const decoded = (mode === "grpc") ? await grpcDecode(value) : await rpcDecode(value);
    res.json({ text: decoded, ms: Date.now() - t0, mode });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

// ---- Benchmark endpoint (bulk timing, same as your version with tiny polishing) ----
app.post("/bench", async (req, res) => {
  try {
    const protocol   = (req.body?.protocol || "rpc").toLowerCase(); // "rpc" | "grpc"
    const op         = (req.body?.op || "encode").toLowerCase();    // "encode" | "decode"
    const input      = req.body?.text ?? req.body?.value ?? req.body?.data ?? "";
    const iterations = Math.max(1, Math.min(10000, Number(req.body?.iterations ?? 1)));

    const doCall =
      protocol === "grpc"
        ? (op === "encode" ? callGrpc : grpcDecode)
        : (op === "encode" ? callRpc  : rpcDecode);

    // warmup
    const warmup = Math.min(5, iterations);
    for (let i = 0; i < warmup; i++) await doCall(input);

    let lastOutput = "";
    let sumServiceNs = 0n;
    const tStartAll = nsNow();

    for (let i = 0; i < iterations; i++) {
      const t0 = nsNow();
      lastOutput = await doCall(input);
      sumServiceNs += (nsNow() - t0);
      if ((i + 1) % 1000 === 0) await new Promise(r => setImmediate(r));
    }
    const tAll = nsNow() - tStartAll;

    const payload = {
      protocol, op, iterations,
      totalNs: Number(tAll),
      totalMs: Number(tAll) / 1e6,
      serverNsPerOp: Number(sumServiceNs) / iterations,
      roundTripNsPerOp: Number(tAll) / iterations
    };
    if (op === "encode") payload.encoded = lastOutput; else payload.decoded = lastOutput;
    res.json(payload);
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

// ---- (Optional) serve static frontend from the gateway image ----
// const publicDir = path.join(__dirname, "../public"); // put your index.html here if you want single-image
// app.use(express.static(publicDir));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`[gateway] listening on :${PORT}`));