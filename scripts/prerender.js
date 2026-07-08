/**
 * Post-build prerender script.
 *
 * Serves the built `dist/` directory with an SPA fallback, renders each route
 * in headless Chrome (puppeteer), and writes the resulting HTML back into
 * `dist/` so crawlers and first paints get real content.
 *
 * This replaces @prerenderer/rollup-plugin, which silently drops the root
 * index.html under Vite 8 (rolldown).
 */
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import puppeteer from 'puppeteer';

const DIST = 'dist';
const ROUTES = [
  '/',
  '/popular',
  '/docs',
  '/docs/humans',
  '/docs/technical',
  '/docs/about',
];

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
};

const indexHtml = readFileSync(join(DIST, 'index.html'));

const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  let file = join(DIST, path);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');

  if (existsSync(file) && statSync(file).isFile()) {
    res.setHeader('Content-Type', MIME[extname(file)] ?? 'application/octet-stream');
    res.end(readFileSync(file));
  } else {
    // SPA fallback
    res.setHeader('Content-Type', 'text/html');
    res.end(indexHtml);
  }
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();

const browser = await puppeteer.launch({ headless: true });

try {
  const page = await browser.newPage();
  const rendered = [];

  for (const route of ROUTES) {
    await page.goto(`http://127.0.0.1:${port}${route}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    // Wait until React has rendered something into #root.
    await page.waitForFunction(
      () => (document.getElementById('root')?.children.length ?? 0) > 0,
      { timeout: 15_000 },
    );
    // Give unhead/meta effects a beat to settle.
    await new Promise((r) => setTimeout(r, 500));

    const html = await page.content();
    rendered.push([route, `<!DOCTYPE html>\n${html.replace(/^<!DOCTYPE html>/i, '').trim()}`]);
    console.log(`prerendered ${route}`);
  }

  // Write after all renders so the SPA fallback keeps serving the original shell.
  for (const [route, html] of rendered) {
    const outFile = route === '/'
      ? join(DIST, 'index.html')
      : join(DIST, route.slice(1), 'index.html');
    mkdirSync(dirname(outFile), { recursive: true });
    writeFileSync(outFile, html);
  }
} finally {
  await browser.close();
  server.close();
}
