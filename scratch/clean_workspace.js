const fs = require("fs");
const path = require("path");

const rootDir = process.cwd();
const publicDir = path.join(rootDir, "public");

// Files to move to public/
const filesToMove = [
  "ads.txt",
  "favicon.ico",
  "favicon.png",
  "favicon.svg",
  "favicon-light.svg",
  "apple-touch-icon.png",
  "og-cover.png"
];

filesToMove.forEach(file => {
  const srcPath = path.join(rootDir, file);
  const destPath = path.join(publicDir, file);
  if (fs.existsSync(srcPath)) {
    try {
      fs.renameSync(srcPath, destPath);
      console.log(`Moved: ${file} -> public/${file}`);
    } catch (e) {
      console.error(`Error moving ${file}:`, e);
    }
  }
});

// Delete all HTML files in the root folder
const files = fs.readdirSync(rootDir);
files.forEach(file => {
  if (file.endsWith(".html")) {
    const filePath = path.join(rootDir, file);
    try {
      fs.unlinkSync(filePath);
      console.log(`Deleted root legacy file: ${file}`);
    } catch (e) {
      console.error(`Error deleting ${file}:`, e);
    }
  }
});

console.log("Cleanup completed successfully!");
