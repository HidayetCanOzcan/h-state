import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RED = '\x1b[31m';
const NC = '\x1b[0m';

const log = {
  info: (msg) => console.log(`${BLUE}ℹ️  ${msg}${NC}`),
  success: (msg) => console.log(`${GREEN}✅ ${msg}${NC}`),
  warn: (msg) => console.log(`${YELLOW}⚠️  ${msg}${NC}`),
  error: (msg) => console.log(`${RED}❌ ${msg}${NC}`),
};

function run(cmd, opts = {}) {
  return execSync(cmd, { stdio: 'inherit', ...opts });
}

function bumpVersion(current, type) {
  const match = current.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) throw new Error(`Invalid version: ${current}`);
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Invalid bump type: ${type}`);
  }
}

function getPublishedVersion(name) {
  try {
    return execSync(`npm view ${name} version`, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

function main() {
  const args = process.argv.slice(2);
  const bumpType = args.find((a) => ['patch', 'minor', 'major'].includes(a)) || 'patch';
  const dryRun = args.includes('--dry-run');
  const skipTests = args.includes('--skip-tests');

  console.log(`\n${GREEN}╔══════════════════════════════════════════╗${NC}`);
  console.log(`${GREEN}║            📦 H-STATE RELEASE            ║${NC}`);
  console.log(`${GREEN}╚══════════════════════════════════════════╝${NC}\n`);

  if (dryRun) log.warn('DRY RUN MODE - no version bump, publish, or push will happen\n');

  // Clean working tree check
  const status = execSync('git status --porcelain').toString().trim();
  if (status && !dryRun) {
    log.error('Working directory is not clean. Commit or stash changes first.');
    process.exit(1);
  }

  const packagePath = join(process.cwd(), 'package.json');
  const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
  const currentVersion = pkg.version;
  const newVersion = bumpVersion(currentVersion, bumpType);
  const published = getPublishedVersion(pkg.name);

  console.log(`${BLUE}Version:${NC}`);
  console.log(`  Current:   ${YELLOW}${currentVersion}${NC}`);
  console.log(`  New:       ${GREEN}${newVersion}${NC}`);
  console.log(`  Published: ${published ? YELLOW + published : GREEN + '(new package)'}${NC}`);
  console.log(`  Type:      ${bumpType}\n`);

  if (published === newVersion) {
    log.error(`Version ${newVersion} is already published. Use a different bump type.`);
    process.exit(1);
  }

  // Tests
  if (!skipTests) {
    log.info('Running tests...');
    run('npm run test');
    log.success('Tests passed\n');
  } else {
    log.warn('Skipping tests (--skip-tests)\n');
  }

  // Build
  log.info('Building package...');
  run('npm run build');
  log.success('Build completed\n');

  if (dryRun) {
    log.info('Dry run publish...');
    run('npm publish --dry-run');
    log.success('\nDry run successful - no changes made');
    return;
  }

  // Bump version
  pkg.version = newVersion;
  writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
  log.success(`Version bumped to ${newVersion}`);

  // Commit + tag
  run('git add package.json');
  run(`git commit -m "release: v${newVersion}"`);
  run(`git tag -a v${newVersion} -m "Release v${newVersion}"`);
  log.success(`Committed and tagged v${newVersion}`);

  // Publish
  log.info('Publishing to npm...');
  run('npm publish --access public');
  log.success(`Published h-state@${newVersion} to npm`);

  // Push
  log.info('Pushing to git...');
  run('git push');
  run('git push --tags');

  console.log(`\n${GREEN}🎉 h-state@${newVersion} released successfully!${NC}`);
  console.log(`\n${BLUE}Install:${NC} npm install h-state@${newVersion}\n`);
}

try {
  main();
} catch (error) {
  log.error(error.message);
  process.exit(1);
}
