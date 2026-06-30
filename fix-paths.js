const fs = require('fs');
const path = require('path');

function processHtml(filePath, depth) {
  let content = fs.readFileSync(filePath, 'utf8');
  const prefix = depth === 0 ? '.' : '..'.repeat(depth);
  
  // Replace absolute paths with relative paths
  content = content.replace(/(href|src|from)\s*=\s*(['"])\/assets\//g, `$1=$2${prefix}/assets/`);
  content = content.replace(/(href|src|from)\s*=\s*(['"])\/pages\//g, `$1=$2${prefix}/pages/`);
  content = content.replace(/(href|src)\s*=\s*(['"])\/index\.html(['"])/g, `$1=$2${prefix}/index.html$3`);
  content = content.replace(/(href)\s*=\s*(['"])\/(?:['"])/g, `$1=$2${prefix}/index.html$2`);
  
  // For JS modules
  content = content.replace(/from\s+(['"])\/assets\//g, `from $1${prefix}/assets/`);
  content = content.replace(/window\.location\.href\s*=\s*(['"])\/pages\//g, `window.location.href=$1${prefix}/pages/`);

  fs.writeFileSync(filePath, content);
}

function processJs(filePath, depth) {
  let content = fs.readFileSync(filePath, 'utf8');
  const prefix = depth === 0 ? '.' : '..'.repeat(depth);
  
  content = content.replace(/(href|src|from)\s*=\s*(['"])\/assets\//g, `$1=$2${prefix}/assets/`);
  content = content.replace(/(href|src|from)\s*=\s*(['"])\/pages\//g, `$1=$2${prefix}/pages/`);
  content = content.replace(/window\.location\.href\s*=\s*(['"])\/pages\//g, `window.location.href=$1${prefix}/pages/`);
  content = content.replace(/from\s+(['"])\/assets\//g, `from $1${prefix}/assets/`);

  fs.writeFileSync(filePath, content);
}

const dirsToProcess = [
  path.join(__dirname, 'docs'),
  path.join(__dirname, 'task-1', 'frontend')
];

function walk(dir, depth) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, depth + 1);
    } else {
      if (fullPath.endsWith('.html')) {
        processHtml(fullPath, depth);
      } else if (fullPath.endsWith('.js')) {
        processJs(fullPath, depth);
      }
    }
  }
}

dirsToProcess.forEach(dir => {
  console.log(`Processing directory: ${dir}`);
  walk(dir, 0);
});
console.log("Done fixing paths.");
