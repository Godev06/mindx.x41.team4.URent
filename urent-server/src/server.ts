import "dotenv/config";
import dns from "node:dns";
import { app } from "./app";
import { initializeFirebase } from "./config/firebase";

dns.setDefaultResultOrder("ipv4first");
initializeFirebase();

const PORT = process.env.PORT || 8000;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(
      `  \x1b[32m➜\x1b[0m  \x1b[1m\x1b[37mAPI Local:\x1b[0m   \x1b[36mhttp://localhost:${PORT}/\x1b[0m`,
    );
  });
}

export default app;
