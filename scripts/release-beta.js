import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Versiyonu arttır ve beta tag'i ekle
function incrementVersion() {
  const packagePath = join(process.cwd(), 'package.json');
  const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
  const currentVersion = pkg.version;

  // Mevcut versiyonu parçala
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  
  // Beta numarasını bul
  const betaRegex = /-beta\.(\d+)$/;
  const betaMatch = currentVersion.match(betaRegex);
  let betaNumber = betaMatch ? Number(betaMatch[1]) + 1 : 1;

  // Yeni versiyon oluştur
  const newVersion = `${major}.${minor}.${patch}-beta.${betaNumber}`;
  
  // package.json'ı güncelle
  pkg.version = newVersion;
  writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
  
  return newVersion;
}

try {
  // Git durumunu kontrol et
  const status = execSync('git status --porcelain').toString();
  if (status) {
    console.error('❌ Working directory is not clean. Please commit or stash changes first.');
    process.exit(1);
  }

  // Test'leri çalıştır
  console.log('🧪 Running tests...');
  execSync('npm run test', { stdio: 'inherit' });

  // Yeni versiyon oluştur
  const newVersion = incrementVersion();
  console.log(`📦 Incrementing version to ${newVersion}`);

  // Build al
  console.log('🔨 Building package...');
  execSync('npm run build', { stdio: 'inherit' });

  // Git tag oluştur
  console.log('🏷️  Creating git tag...');
  execSync(`git tag -a v${newVersion} -m "Release beta version ${newVersion}"`, { stdio: 'inherit' });

  // NPM'e yayınla
  console.log('🚀 Publishing to npm with beta tag...');
  execSync('npm publish --tag beta', { stdio: 'inherit' });

  // Git tag'i push et
  console.log('📤 Pushing git tag...');
  execSync('git push --tags', { stdio: 'inherit' });

  console.log(`✅ Successfully released version ${newVersion}`);
  console.log(`📝 Users can now install with: npm install h-state@beta`);

} catch (error) {
  console.error('❌ Release failed:', error.message);
  process.exit(1);
}
