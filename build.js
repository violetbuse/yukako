const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Configuration for the main project build
const mainConfig = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/index.js',
  platform: 'node',
  target: 'node18',
  format: 'esm',
  external: [
    'dotenv',
    'path',
    'fs',
    'url',
    'os',
    'crypto',
    'stream',
    'util',
    'events',
    'app-root-path',
    'express',
    'node:path',
    'node:fs',
    'node:url',
    'node:os',
    'node:crypto',
    'node:stream',
    'node:util',
    'node:events',
    'node:process',
    'node:http',
    'node:https',
    'node:net',
    'node:zlib',
    'node:buffer',
    'node:querystring'
  ],
  banner: {
    js: 'import * as build_banner_url from "url";\nimport * as build_banner_path from "path";\nconst __filename = build_banner_url.fileURLToPath(import.meta.url);\nconst __dirname = build_banner_path.dirname(__filename);'
  }
};

// Configuration for worker builds
const workerConfig = {
  platform: 'node',
  target: 'node18',
  format: 'esm',
  bundle: true,
  external: [
    'script',
    'path',
    'fs',
    'url',
    'os',
    'crypto',
    'stream',
    'util',
    'events',
    'app-root-path',
    'express',
    'node:path',
    'node:fs',
    'node:url',
    'node:os',
    'node:crypto',
    'node:stream',
    'node:util',
    'node:events',
    'node:process',
    'node:http',
    'node:https',
    'node:net',
    'node:zlib',
    'node:buffer',
    'node:querystring'
  ],
};

// Function to build individual workers
async function buildWorkers() {
  const workersDir = path.join(__dirname, 'src', 'workers');
  const files = fs.readdirSync(workersDir);
  
  for (const file of files) {
    if (file.endsWith('.ts') && file !== 'index.ts') {
      const workerName = path.basename(file, '.ts');
      await esbuild.build({
        ...workerConfig,
        entryPoints: [path.join(workersDir, file)],
        outfile: path.join('dist', 'workers', `${workerName}.js`),
      });
    }
  }
}

// Main build function
async function build() {
  try {
    // Create dist directories if they don't exist
    if (!fs.existsSync('dist')) {
      fs.mkdirSync('dist');
    }
    if (!fs.existsSync('dist/workers')) {
      fs.mkdirSync('dist/workers');
    }

    // Build main project
    console.log('Building main project...');
    await esbuild.build(mainConfig);

    // Build workers
    console.log('Building workers...');
    await buildWorkers();

    // Create package.json in dist to specify module type
    const distPackageJson = {
      type: "module"
    };
    fs.writeFileSync(
      path.join('dist', 'package.json'),
      JSON.stringify(distPackageJson, null, 2)
    );

    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
