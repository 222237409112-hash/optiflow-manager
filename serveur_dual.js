import express from "express";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

const app = express();

// Configuration Express
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS plus permissif
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");

    // Répondre aux requêtes OPTIONS (preflight)
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

// Servir les fichiers statiques
app.use(express.static(__dirname));

// Page d'accueil
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Endpoint principal pour la conversion dual
app.post("/tp1_dual", (req, res) => {
    console.log('\n📥 Requête reçue:', new Date().toLocaleString('fr-FR'));
    console.log('Données:', JSON.stringify(req.body, null, 2));

    const data = req.body;

    // Validation des données
    if (!data || !data.nbVar || !data.nbCtr) {
        console.error('❌ Données invalides');
        return res.status(400).json({
            error: "Données invalides : nbVar et nbCtr requis",
            received: data
        });
    }

    if (!data.objective || !data.constraints) {
        console.error('❌ Données incomplètes');
        return res.status(400).json({
            error: "Données incomplètes : objective et constraints requis"
        });
    }

    // Déterminer le nom de l'exécutable
    const isWindows = process.platform === "win32";
    const exeName = isWindows ? "tp1_dual.exe" : "tp1_dual";
    const exePath = path.join(__dirname, exeName);

    console.log(`🔍 Recherche de l'exécutable: ${exePath}`);

    // Vérifier l'existence de l'exécutable
    if (!existsSync(exePath)) {
        console.error(`❌ Exécutable ${exeName} introuvable`);
        return res.status(500).json({
            error: `Exécutable ${exeName} introuvable dans ${__dirname}`,
            help: `Compilez dual.c avec: gcc dual.c -o ${exeName} -lm`,
            path: exePath
        });
    }

    console.log(`✅ Exécutable trouvé`);
    console.log(`🚀 Lancement du programme C...`);

    // Lancer le programme C
    const proc = spawn(exePath, [], {
        cwd: __dirname,
        stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = "";
    let errorOutput = "";
    let hasResponded = false;

    // Timeout de sécurité
    const timeout = setTimeout(() => {
        if (!hasResponded) {
            hasResponded = true;
            proc.kill();
            console.error('⏱️ Timeout du programme C');
            res.status(500).json({
                error: "Le programme C a pris trop de temps à répondre",
                timeout: "10 secondes"
            });
        }
    }, 10000);

    proc.stdout.on("data", (d) => {
        const text = d.toString();
        output += text;
        console.log('📤 Sortie:', text);
    });

    proc.stderr.on("data", (d) => {
        const text = d.toString();
        errorOutput += text;
        console.error('⚠️ Erreur:', text);
    });

    // Écrire les données vers le programme C
    try {
        console.log('📝 Envoi des données au programme C...');

        // Type de problème (M pour Max, N pour Min)
        const typeChar = data.type === "max" ? "M" : "N";
        proc.stdin.write(`${typeChar}\n`);
        console.log(`  Type: ${typeChar}`);

        // Nombre de variables
        proc.stdin.write(`${data.nbVar}\n`);
        console.log(`  Variables: ${data.nbVar}`);

        // Nombre de contraintes
        proc.stdin.write(`${data.nbCtr}\n`);
        console.log(`  Contraintes: ${data.nbCtr}`);

        // Coefficients de la fonction objectif
        console.log('  Objectif:', data.objective);
        data.objective.forEach(c => proc.stdin.write(`${c}\n`));

        // Contraintes
        console.log('  Données des contraintes:');
        data.constraints.forEach((constraint, idx) => {
            console.log(`    C${idx + 1}:`, constraint);
            constraint.coeffs.forEach(a => proc.stdin.write(`${a}\n`));
            proc.stdin.write(`${constraint.sign}\n`);
            proc.stdin.write(`${constraint.b}\n`);
        });

        proc.stdin.end();
        console.log('✅ Données envoyées au programme C');

    } catch (err) {
        clearTimeout(timeout);
        if (!hasResponded) {
            hasResponded = true;
            console.error('❌ Erreur lors de l\'écriture:', err);
            return res.status(500).json({
                error: "Erreur d'écriture vers le programme",
                details: err.message
            });
        }
    }

    // Gestion de la fermeture du processus
    proc.on("close", (code) => {
        clearTimeout(timeout);

        if (hasResponded) return;
        hasResponded = true;

        console.log(`🏁 Programme terminé avec le code: ${code}`);

        if (code !== 0) {
            console.error('❌ Erreur d\'exécution');
            return res.status(500).json({
                error: `Erreur d'exécution (code ${code})`,
                details: errorOutput || "Aucun détail disponible",
                output: output
            });
        }

        if (!output || output.trim() === "") {
            console.warn('⚠️ Aucune sortie du programme');
            return res.status(500).json({
                error: "Le programme n'a produit aucune sortie",
                stderr: errorOutput
            });
        }

        console.log('✅ Conversion réussie');
        res.json({
            success: true,
            output: output,
            primalType: data.type,
            dualType: data.type === "max" ? "min" : "max"
        });
    });

    // Gestion des erreurs de processus
    proc.on("error", (err) => {
        clearTimeout(timeout);

        if (hasResponded) return;
        hasResponded = true;

        console.error('❌ Erreur de lancement:', err);
        res.status(500).json({
            error: "Erreur de lancement du programme",
            details: err.message,
            executable: exePath
        });
    });
});

// Endpoint de santé
app.get("/health", (req, res) => {
    const isWindows = process.platform === "win32";
    const exeName = isWindows ? "tp1_dual.exe" : "tp1_dual";
    const exePath = path.join(__dirname, exeName);
    const executableExists = existsSync(exePath);

    console.log('🏥 Health check');
    console.log(`  Executable: ${exeName}`);
    console.log(`  Exists: ${executableExists}`);

    res.json({
        status: "ok",
        executable: exeName,
        executablePath: exePath,
        executableExists: executableExists,
        platform: process.platform,
        directory: __dirname,
        timestamp: new Date().toISOString()
    });
});

// Gestion des erreurs 404
app.use((req, res) => {
    res.status(404).json({
        error: "Route non trouvée",
        path: req.path
    });
});

// Fonction pour essayer plusieurs ports
function startServer(port, maxAttempts = 5) {
    const server = app.listen(port, () => {
        console.log('\n' + '='.repeat(60));
        console.log('🔄 SERVEUR CONVERTISSEUR DUAL DÉMARRÉ');
        console.log('='.repeat(60));
        console.log(`📡 URL:        http://localhost:${port}`);
        console.log(`📂 Répertoire: ${__dirname}`);
        console.log(`⏰ Démarré:    ${new Date().toLocaleString('fr-FR')}`);
        console.log(`💻 Plateforme: ${process.platform}`);

        const isWindows = process.platform === "win32";
        const exeName = isWindows ? "tp1_dual.exe" : "tp1_dual";
        const exePath = path.join(__dirname, exeName);

        if (existsSync(exePath)) {
            console.log(`✅ Exécutable trouvé: ${exeName}`);
        } else {
            console.log(`⚠️  ATTENTION: Exécutable ${exeName} NON TROUVÉ`);
            console.log(`   Compilez avec: gcc dual.c -o ${exeName} -lm`);
        }

        console.log('='.repeat(60));
        console.log('✨ Prêt à recevoir des requêtes\n');

    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`⚠️  Port ${port} déjà utilisé`);
            if (maxAttempts > 1) {
                console.log(`🔄 Tentative sur le port ${port + 1}...`);
                startServer(port + 1, maxAttempts - 1);
            } else {
                console.error(`\n❌ ERREUR: Impossible de démarrer le serveur`);
                console.error(`\n💡 Solutions:`);
                console.error(`   1. Arrêtez les autres serveurs Node.js`);
                console.error(`   2. Windows: taskkill /IM node.exe /F`);
                console.error(`   3. Linux/Mac: killall node`);
                console.error(`   4. Ou changez le port dans le code\n`);
                process.exit(1);
            }
        } else {
            console.error('❌ Erreur serveur:', err);
            process.exit(1);
        }
    });

    // Gestion de l'arrêt propre
    process.on('SIGINT', () => {
        console.log('\n\n🛑 Arrêt du serveur...');
        server.close(() => {
            console.log('✅ Serveur arrêté proprement');
            process.exit(0);
        });
    });
}

// Démarrer avec le port 5002
const PORT = process.env.PORT || 5002;
startServer(PORT);