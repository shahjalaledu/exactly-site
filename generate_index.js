const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const TEMPLATE = path.join(ROOT, "template.html");
const OUTPUT = path.join(ROOT, "index.html");

// Which HTML files to ignore from the listing
const IGNORE = new Set([
  "index.html",     // generated output
  "template.html",  // template
]);

function listHtmlFiles(rootDir) {
  const results = [];

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(rootDir, full);
      if (entry.isDirectory()) {
        // Skip node_modules / .git / .github etc. for safety
        if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".github") {
          continue;
        }
        walk(full);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) {
        if (!IGNORE.has(entry.name)) {
          results.push(rel.replace(/\\/g, "/"));
        }
      }
    }
  }

  walk(rootDir);
  return results.sort();
}

function generateIndex() {
  if (!fs.existsSync(TEMPLATE)) {
    console.error("template.html not found");
    process.exit(1);
  }

  const template = fs.readFileSync(TEMPLATE, "utf8");
  const files = listHtmlFiles(ROOT);

  const listHtml = [
    '<ul class="pages">'
  ];

  if (files.length === 0) {
    listHtml.push('<li>No HTML pages found yet.</li>');
  } else {
    for (const file of files) {
      const name = path.basename(file);
      listHtml.push(
        `<li class="page-item">` +
          `<a href="${file}">` +
            `<div class="page-name">${name}</div>` +
            `<div class="page-path">${file}</div>` +
          `</a>` +
        `</li>`
      );
    }
  }

  listHtml.push("</ul>");

  const markerStart = "<!-- AUTO_INDEX_START -->";
  const markerEnd = "<!-- AUTO_INDEX_END -->";

  const startIdx = template.indexOf(markerStart);
  const endIdx = template.indexOf(markerEnd);

  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    console.error("Markers AUTO_INDEX_START / AUTO_INDEX_END not found or misordered in template.html");
    process.exit(1);
  }

  const before = template.slice(0, startIdx + markerStart.length);
  const after = template.slice(endIdx);

  const output = `${before}\n${listHtml.join("\n")}\n${after}`;
  fs.writeFileSync(OUTPUT, output, "utf8");
  console.log("index.html generated with", files.length, "HTML page(s).");
}

generateIndex();
