import { preview } from "vite";

const server = await preview({
  preview: {
    port: 5100,
    host: "0.0.0.0",
  },
});

server.printUrls();
console.log("[practice-wegenz] Running on port 5100");
