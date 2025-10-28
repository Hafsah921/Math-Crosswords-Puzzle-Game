import express from "express";
import helmet from "helmet";
import compression from "compression";
import { fileURLToPath } from "url";
import { dirname, join, extname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC = join(__dirname, "public");

// Basic security headers
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "script-src": ["'self'"],
        "img-src": ["'self'", "data:"],
        "style-src": ["'self'", "'unsafe-inline'"] // inline styles in your CSS/HTML
      }
    }
  })
);

app.disable("x-powered-by");
app.use(compression());

// Static assets (no directory listing, cache JS/CSS)
app.use(
  express.static(PUBLIC, {
    index: false,            // don't auto-serve index.html
    extensions: false,
    setHeaders(res, path) {
      const ext = extname(path);
      if (ext === ".js" || ext === ".css") {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        res.setHeader("Cache-Control", "public, max-age=3600");
      }
    }
  })
);

// Explicitly hide /index.html (redirect to /)
app.get("/index.html", (_req, res) => res.redirect(301, "/"));

// Health check
app.get("/healthz", (_req, res) => res.send("ok"));

// Root → serve the app
app.get("/", (_req, res) => {
  res.sendFile(join(PUBLIC, "index.html"));
});

// Anything else → 404 (you can change to SPA fallback if needed)
app.use((_req, res) => {
  res.status(404).send("Not found");
});

app.listen(PORT, () => {
  console.log(`✅ Math Puzzle running at PORT:${PORT}`);
});
