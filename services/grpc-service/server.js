import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROTO_PATH = join(__dirname, "encoder.proto");

const pkgDef = protoLoader.loadSync(PROTO_PATH, { longs: String, enums: String, defaults: true });
const proto = grpc.loadPackageDefinition(pkgDef).encoder;

function encode(call, callback) {
  const text = call.request?.text ?? "";
  const encoded = Buffer.from(text, "utf8").toString("base64");
  callback(null, { encoded });
}

//function main() {
//  const server = new grpc.Server();
//  server.addService(proto.Encoder.service, { Encode: encode });
//  const addr = process.env.GRPC_ADDR || "0.0.0.0:50051";
//  server.bindAsync(addr, grpc.ServerCredentials.createInsecure(), () => {
//    console.log(`[grpc] listening on ${addr}`);
//    server.start();
//  });
//}

function main() {
  const server = new grpc.Server();
  server.addService(proto.Encoder.service, { Encode: encode });
  const addr = process.env.GRPC_ADDR || "0.0.0.0:50051";

  server.bindAsync(addr, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
      console.error("[grpc-encode] bind error:", err.message);
      process.exit(1);
    }
    console.log(`[grpc-encode] listening on ${addr} (port ${port})`);
    server.start();
  });
}

main();