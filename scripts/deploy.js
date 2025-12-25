const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '..');
const BUILD_DIR = path.join(PROJECT_ROOT, '.next');
const STANDALONE_SRC = path.join(BUILD_DIR, 'standalone');
const TARGET_DIR = path.join(PROJECT_ROOT, 'product', 'standalone');

console.log('Starting deployment process...');

// 1. Run Build
console.log('Running next build...');
try {
    execSync('npm run build', { cwd: PROJECT_ROOT, stdio: 'inherit' });
} catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
}

// 2. Prepare Target Directory
console.log('Cleaning target directory:', TARGET_DIR);
if (fs.existsSync(TARGET_DIR)) {
    fs.rmSync(TARGET_DIR, { recursive: true, force: true });
}
fs.mkdirSync(TARGET_DIR, { recursive: true });

// 3. Copy Standalone Files
console.log('Copying standalone files...');
// The standalone folder usually contains a folder structure matching the project source.
// We need to find the root inside standalone that contains server.js, or just copy everything.
// Usually: .next/standalone contains everything needed.
// IMPORTANT: .next/standalone might have `d/SAMAI/SourceCode/.../eval/server.js` if monorepo logic triggers, 
// or mostly just directly `server.js` and `node_modules` and `.next` (minimal).
// Let's verify structure after copy, but for now we copy contents of standalone.

fs.cpSync(STANDALONE_SRC, TARGET_DIR, { recursive: true });

// 4. Copy Static Assets (Required for standalone)
console.log('Copying static assets...');
const publicSrc = path.join(PROJECT_ROOT, 'public');
const publicDest = path.join(TARGET_DIR, 'public');
if (fs.existsSync(publicSrc)) {
    fs.cpSync(publicSrc, publicDest, { recursive: true });
}

const staticSrc = path.join(BUILD_DIR, 'static');
const staticDest = path.join(TARGET_DIR, '.next', 'static');
// .next folder should already exist from standalone copy, but let's ensure .next exists
if (!fs.existsSync(path.join(TARGET_DIR, '.next'))) {
    fs.mkdirSync(path.join(TARGET_DIR, '.next'));
}
if (fs.existsSync(staticSrc)) {
    fs.cpSync(staticSrc, staticDest, { recursive: true });
}

// 5. Copy web.config
console.log('Copying web.config...');
const webConfigSrc = path.join(PROJECT_ROOT, 'web.config');
const webConfigDest = path.join(TARGET_DIR, 'web.config');
if (fs.existsSync(webConfigSrc)) {
    fs.copyFileSync(webConfigSrc, webConfigDest);
} else {
    console.warn('Warning: Source web.config not found at', webConfigSrc);
}

// 6. Copy api_test.htm
console.log('Copying api_test.htm...');
const apiTestSrc = path.join(PROJECT_ROOT, 'api_test.htm');
const apiTestDest = path.join(TARGET_DIR, 'public', 'api_test.htm');
if (fs.existsSync(apiTestSrc)) {
    // Ensure public dir exists (it should from step 4)
    if (!fs.existsSync(path.dirname(apiTestDest))) {
        fs.mkdirSync(path.dirname(apiTestDest), { recursive: true });
    }
    fs.copyFileSync(apiTestSrc, apiTestDest);
} else {
    console.warn('Warning: api_test.htm not found at', apiTestSrc);
}

// 7. Copy api_swagger.html
console.log('Copying api_swagger.html...');
const apiSwaggerSrc = path.join(PROJECT_ROOT, 'api_swagger.html');
const apiSwaggerDest = path.join(TARGET_DIR, 'public', 'api_swagger.html');
if (fs.existsSync(apiSwaggerSrc)) {
    // Ensure public dir exists (it should from step 4)
    if (!fs.existsSync(path.dirname(apiSwaggerDest))) {
        fs.mkdirSync(path.dirname(apiSwaggerDest), { recursive: true });
    }
    fs.copyFileSync(apiSwaggerSrc, apiSwaggerDest);
} else {
    console.warn('Warning: api_swagger.html not found at', apiSwaggerSrc);
}

// 8. Patch server.js for IISNode (Named Pipes)
console.log('Patching server.js for IISNode compatibility...');
const serverJsPath = path.join(TARGET_DIR, 'server.js');
let serverJsContent = fs.readFileSync(serverJsPath, 'utf8');

// Allow PORT to be a string (pipe) and disable hostname if using pipe
serverJsContent = serverJsContent
    .replace(
        "const currentPort = parseInt(process.env.PORT, 10) || 3000",
        "const currentPort = process.env.PORT || 3000"
    )
    .replace(
        "const hostname = process.env.HOSTNAME || '0.0.0.0'",
        "const hostname = process.env.PORT && isNaN(Number(process.env.PORT)) ? undefined : (process.env.HOSTNAME || '0.0.0.0')"
    );

fs.writeFileSync(serverJsPath, serverJsContent);

// 7. Set Permissions (Windows IIS)
console.log('Setting permissions for IIS_IUSRS...');
try {
    execSync(`icacls "${TARGET_DIR}" /grant "IIS_IUSRS:(OI)(CI)F" /T`, { stdio: 'inherit' });
} catch (error) {
    console.warn('Warning: Failed to set permissions. You may need to run this script as Administrator or set permissions manually.', error.message);
}

console.log('Deployment artifacts prepared at:', TARGET_DIR);
