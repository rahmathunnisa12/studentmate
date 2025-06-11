const fs = require('fs');
const path = require('path');
const { parse } = require('path-to-regexp');

const ROOT_DIR = path.resolve(__dirname);

// Regex to detect Express routes
const ROUTE_REGEX = /(app|router)\.(get|post|put|delete|use)\s*\(\s*['"`]([^'"`]+)['"`]/gim;

function isValidRoute(routePath) {
  try {
    parse(routePath); // parse throws error if malformed
    return true;
  } catch (e) {
    console.warn(`❌ Malformed route detected: "${routePath}"`);
    console.warn("   → Fix: Add a valid parameter name after ':'");
    console.warn("   ✅ Example: '/user/:id'\n");
    return false;
  }
}

function scanFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') {
        console.log(`📂 Skipping directory: ${fullPath}`);
        continue;
      }
      scanFiles(fullPath);
      continue;
    }

    if (entry.isFile() && fullPath.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');

      let modifiedContent = content;
      let modified = false;
      let match;

      while ((match = ROUTE_REGEX.exec(content)) !== null) {
        const routeString = match[3];
        console.log(`📍 Validating route: "${routeString}"`);

        if (routeString === '*') {
          console.warn(`🔧 Auto-fixing wildcard route in ${fullPath}`);
          const fixRegex = new RegExp(`(app|router)\\.(get|post|use|put|delete)\\(\\s*['"\`]\\*['"\`]`, 'g');
          modifiedContent = modifiedContent.replace(fixRegex, m => m.replace('*', '/:catchAll(*)'));
          modified = true;
          continue;
        }

        if (/https?:\/\//.test(routeString)) {
          console.warn(`⚠️ URL used as route path in ${fullPath}: "${routeString}"`);
          continue;
        }

        isValidRoute(routeString);
      }

      if (modified) {
        fs.writeFileSync(fullPath, modifiedContent, 'utf8');
        console.log(`✅ Auto-fix applied to ${fullPath}`);
      }
    }
  }
}

console.log("🔍 Starting route scan...");
scanFiles(ROOT_DIR);
console.log("✅ Route scan completed.");
