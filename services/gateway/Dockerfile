FROM node:20-alpine
WORKDIR /app

# deps (expects package.json in services/gateway/)
COPY services/gateway/package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm i --omit=dev; fi

# app code
COPY services/gateway/ ./

# protos (paths are relative to context = .)
COPY services/grpc-service/encoder.proto ./encoder.proto
COPY services/grpc-decode-service/decoder.proto ./decoder.proto

ENV NODE_ENV=production
EXPOSE 8080
CMD ["node","server.js"]