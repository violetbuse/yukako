const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const cpr = require('cpr');

const logging_options = {
  logLevel: 'info',
  color: true
}

// Configuration for the main project build
const mainConfig = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/index.cjs',
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  sourcemap: true,
  banner: {
    // js: 'import * as build_banner_url from "url";\nimport * as build_banner_path from "path";\nconst __filename = build_banner_url.fileURLToPath(import.meta.url);\nconst __dirname = build_banner_path.dirname(__filename);'
  },
  ...logging_options
};

// Configuration for the main project build
const cliConfig = {
  entryPoints: ['src/commands/cli.ts'],
  bundle: true,
  outfile: 'dist/cli.cjs',
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  sourcemap: true,
  banner: {
    // js: 'import * as build_banner_url from "url";\nimport * as build_banner_path from "path";\nconst __filename = build_banner_url.fileURLToPath(import.meta.url);\nconst __dirname = build_banner_path.dirname(__filename);'
  },
  ...logging_options
};

// Configuration for worker builds
const workerConfig = {
  platform: 'node',
  target: 'node18',
  format: 'esm',
  bundle: true,
  external: [
    // All the external dependencies that are not needed for the worker
    'script'
  ],
  ...logging_options
};

// Function to build individual workers
async function buildWorkers() {
  const workersDir = path.join(__dirname, 'src', 'workers');
  const files = fs.readdirSync(workersDir);
  
  const workerBuildContexts = files
    .filter(file => file.endsWith('.ts') && file !== 'index.ts')
    .map(file => {
      const workerName = path.basename(file, '.ts');
      return esbuild.context({
        ...workerConfig,
        entryPoints: [path.join(workersDir, file)],
        outfile: path.join('dist', 'workers', `${workerName}.js`),
      });
    });

  return await Promise.all(workerBuildContexts);
}

// Main build function
async function build(watch) {
  try {
    // Create dist directories if they don't exist
    if (!fs.existsSync('dist')) {
      fs.mkdirSync('dist');
    }
    if (!fs.existsSync('dist/workers')) {
      fs.mkdirSync('dist/workers');
    }

    const mainBuildContext = await esbuild.context({
      ...mainConfig,
    });

    const cliBuildContext = await esbuild.context({
      ...cliConfig,
    });

    const workerBuildContexts = await buildWorkers(watch);

    const contexts = [mainBuildContext, cliBuildContext, ...workerBuildContexts];

    // // Create package.json in dist to specify module type
    // const distPackageJson = {
    //   type: "module"
    // };
    // fs.writeFileSync(
    //   path.join('dist', 'package.json'),
    //   JSON.stringify(distPackageJson, null, 2)
    // );

    if (!watch) {
      await Promise.all(contexts.map(context => context.rebuild()));
      await Promise.all(contexts.map(context => context.dispose()));
      console.log('Build completed successfully!');
    } else {
      console.log('Watching for changes...');
      await Promise.all(contexts.map(context => context.watch()));
      process.on('SIGINT', () => process.exit(0));
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

// copy the workerd files to dist/workerd
const copyWorkerdFiles = () => {
  cpr('workerd', 'dist/workerd', {
    deleteFirst: true,
    overwrite: true,
    confirm: true,
  });

  // Set permissions to executable for all files in dist/workerd
  fs.readdirSync('dist/workerd').forEach(file => {
    const filePath = path.join('dist/workerd', file);
    fs.chmodSync(filePath, '755');
  });
}

// Parse command line arguments
const watch = process.argv.includes('--watch');
build(watch);
