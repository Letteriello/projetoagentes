const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// List of Node.js built-in modules to check for
const nodeModules = [
  'fs', 'path', 'child_process', 'os', 'net', 'tls', 'http', 'https', 
  'crypto', 'stream', 'zlib', 'util', 'assert', 'buffer'
];

// List of problematic npm packages (server-only)
const serverOnlyPackages = [
  'google-auth-library', '@genkit-ai/googleai', 'genkit', 'genkitx-openai',
  'genkitx-ollama', 'gcp-metadata', 'agent-base', 'https-proxy-agent', 'gtoken'
];

// Directories to exclude from search
const excludeDirs = [
  'node_modules', '.next', '.git', 'public'
];

// File extensions to check
const fileExtensions = ['.js', '.jsx', '.ts', '.tsx'];

// Function to check if a file contains imports of Node.js modules
function checkFileForNodeImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];

    // Check for Node.js built-in modules
    for (const module of nodeModules) {
      // Check for different import patterns
      if (content.includes(`require('${module}')`) || 
          content.includes(`require("${module}")`) || 
          content.includes(`from '${module}'`) || 
          content.includes(`from "${module}"`)) {
        issues.push(`Node.js module: ${module}`);
      }
    }

    // Check for server-only packages
    for (const pkg of serverOnlyPackages) {
      if (content.includes(`require('${pkg}')`) || 
          content.includes(`require("${pkg}")`) || 
          content.includes(`from '${pkg}'`) || 
          content.includes(`from "${pkg}"`)) {
        issues.push(`Server-only package: ${pkg}`);
      }
    }

    return issues.length > 0 ? issues : null;
  } catch (error) {
    return [`Error reading file: ${error.message}`];
  }
}

// Function to check if a file is a client component
function isClientComponent(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Check for "use client" directive at the beginning of the file
    return content.trim().startsWith('"use client"') || content.trim().startsWith("'use client'");
  } catch (error) {
    return false;
  }
}

// Function to scan directories recursively
function scanDirectory(dir) {
  const results = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stats = fs.statSync(itemPath);

    if (stats.isDirectory()) {
      // Skip excluded directories
      if (excludeDirs.includes(item)) continue;
      
      // Recursively scan subdirectories
      results.push(...scanDirectory(itemPath));
    } else if (stats.isFile()) {
      // Check only files with specified extensions
      const ext = path.extname(itemPath);
      if (fileExtensions.includes(ext)) {
        // Only check client components
        if (isClientComponent(itemPath)) {
          const issues = checkFileForNodeImports(itemPath);
          if (issues) {
            results.push({ file: itemPath, issues });
          }
        }
      }
    }
  }

  return results;
}

// Main function
function main() {
  console.log('Checking for Node.js dependencies in client components...');
  const projectRoot = process.cwd();
  const results = scanDirectory(projectRoot);

  if (results.length === 0) {
    console.log('✅ No Node.js dependencies found in client components!');
  } else {
    console.log('❌ Found Node.js dependencies in client components:');
    for (const result of results) {
      console.log(`\nFile: ${result.file}`);
      console.log('Issues:');
      for (const issue of result.issues) {
        console.log(`  - ${issue}`);
      }
    }
    console.log('\nTotal issues found:', results.length);
  }
}

// Run the script
main();
