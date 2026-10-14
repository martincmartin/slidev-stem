import { defineConfig } from "vite";

// Slidev's dev server prints its own URLs and has no hook to add one. So print
// the article's URL after them: Slidev prints its list in one step, right after
// the server starts listening, and a timer runs after that step.
export default defineConfig({
  plugins: [
    {
      name: "narration:print-article-url",
      configureServer(server) {
        const httpServer = server.httpServer;
        httpServer?.once("listening", () => {
          const address = httpServer.address();
          if (address === null || typeof address === "string") return;
          setTimeout(() => {
            console.log(
              `  article             > http://localhost:${String(address.port)}${server.config.base}article\n`,
            );
          });
        });
      },
    },
  ],
});
