import express from "express";
import helmet from "helmet";
import compression from "compression";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC = join(__dirname, "public");

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false
  })
);

app.use(compression());
app.use(express.static(PUBLIC, { index: false }));
app.get("/index.html", (req, res) => res.redirect(301, "/"));
app.get("/", (req, res) => res.sendFile(join(PUBLIC, "index.html")));
app.listen(PORT, () => console.log(`🚀 running on ${PORT}`));
