import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROTO_PATH = join(__dirname, "decoder.proto");

const pkgDef = protoLoader.loadSync(PROTO_PATH, { longs: String, enums: String, defaults: true });
const proto = grpc.loadPackageDefinition(pkgDef).decoder;

function tryBase64Decode(data) {
  const buf = Buffer.from(String(data || ""), "base64");
  const re = buf.toString("base64").replace(/=+$/,"");
  const norm = String(data || "").replace(/[\r\n\s]+/g, "").replace(/=+$/,"");
  if (re !== norm) throw new Error("Invalid base64");
  return buf.toString("utf8");
}

function decode(call, callback) {
  try {
    const decoded = tryBase64Decode(call.request?.data ?? "");
    callback(null, { decoded });
  } catch (e) {
    callback({ code: grpc.status.INVALID_ARGUMENT, message: "Invalid base64 input" });
  }
}

//function main() {
//  const server = new grpc.Server();
//  server.addService(proto.Decoder.service, { Decode: decode });
//  const addr = process.env.GRPC_ADDR || "0.0.0.0:50052";
//  server.bindAsync(addr, grpc.ServerCredentials.createInsecure(), () => {
//    console.log(`[grpc-decode] listening on ${addr}`);
//    server.start();
//  });
//}

function main() {
  const server = new grpc.Server();
  server.addService(proto.Decoder.service, { Decode: decode });
  const addr = process.env.GRPC_DECODE_ADDR || "0.0.0.0:50052";

  server.bindAsync(addr, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
      console.error("[grpc-decode] bind error:", err.message);
      process.exit(1);
    }
    console.log(`[grpc-decode] listening on ${addr} (port ${port})`);
    server.start();
  });
}

main();