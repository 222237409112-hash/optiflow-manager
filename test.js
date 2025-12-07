// test-connection.js
// Script pour tester si tout est bien relié

import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n🔍 VÉRIFICATION DE LA CONFIGURATION DUAL\n');
console.log('═'.repeat(50));

// Test 1 : Fichiers nécessaires
console.log('\n📁 Test 1 : Fichiers présents');
const requiredFiles = [
    'dual.c',
    'server-dual.js',
    'index-dual.html',
    'script-dual.js',
    'style-dual.css',
    'package.json'
];

let allFilesPresent = true;
requiredFiles.forEach(file => {
    const exists = existsSync(path.join(__dirname, file));
    console.log(`   ${exists ? '✅' : '❌'} ${file}`);
    if (!exists) allFilesPresent = false;
});

// Test 2 : Exécutable compilé
console.log('\n🔧 Test 2 : Exécutable compilé');
const isWindows = process.platform === 'win32';
const exeName = isWindows ? 'dual.exe' : 'dual';
const exeExists = existsSync(path.join(__dirname, exeName));
console.log(`   ${exeExists ? '✅' : '❌'} ${exeName}`);
if (!exeExists) {
    console.log(`   💡 Compilez avec: gcc dual.c -o ${exeName} -lm`);
}

// Test 3 : node_modules
console.log('\n📦 Test 3 : Dépendances installées');
const nodeModulesExists = existsSync(path.join(__dirname, 'node_modules'));
console.log(`   ${nodeModulesExists ? '✅' : '❌'} node_modules/`);
if (!nodeModulesExists) {
    console.log('   💡 Installez avec: npm install');
}

// Test 4 : package.json configuration
console.log('\n⚙️  Test 4 : Configuration package.json');
try {
    const pkg = JSON.parse(
        await
        import ('fs').then(fs =>
            fs.promises.readFile(path.join(__dirname, 'package.json'), 'utf8')
        )
    );
    console.log(`   ${pkg.type === 'module' ? '✅' : '❌'} "type": "module"`);
    console.log(`   ${pkg.dependencies?.express ? '✅' : '❌'} express installé`);
} catch (err) {
    console.log('   ❌ Erreur lecture package.json');
}

// Test 5 : Port disponible
console.log('\n🌐 Test 5 : Vérification port 5001');
try {
    const testServer = (await
        import ('net')).createServer();
    testServer.listen(5001, () => {
        console.log('   ✅ Port 5001 disponible');
        testServer.close();
    });
    testServer.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log('   ⚠️  Port 5001 déjà utilisé');
            console.log('   💡 Arrêtez le serveur existant ou changez de port');
        }
    });
} catch (err) {
    console.log('   ❌ Erreur test port');
}

// Résumé final
console.log('\n' + '═'.repeat(50));
console.log('\n📊 RÉSUMÉ\n');

if (allFilesPresent && exeExists && nodeModulesExists) {
    console.log('✅ Tout est prêt ! Lancez le serveur avec: npm start');
    console.log('🌐 Puis ouvrez: http://localhost:5001\n');
} else {
    console.log('⚠️  Configuration incomplète. Corrigez les éléments marqués ❌\n');
    console.log('📝 TODO:');
    if (!allFilesPresent) console.log('   - Créez les fichiers manquants');
    if (!exeExists) console.log(`   - Compilez: gcc dual.c -o ${exeName} -lm`);
    if (!nodeModulesExists) console.log('   - Installez: npm install');
    console.log('');
}

console.log('═'.repeat(50) + '\n');