const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public')); // Servir les fichiers statiques (HTML, CSS, JS)

// Route principale
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API pour calculer MPM avec le programme C
app.post('/api/calculer-mpm', (req, res) => {
    const { nbTaches, durees, arcs } = req.body;

    // Validation des données
    if (!nbTaches || !durees || !arcs) {
        return res.status(400).json({
            error: 'Données manquantes',
            message: 'Veuillez fournir nbTaches, durees et arcs'
        });
    }

    if (durees.length !== nbTaches || arcs.length !== nbTaches) {
        return res.status(400).json({
            error: 'Données invalides',
            message: 'La taille des tableaux ne correspond pas au nombre de tâches'
        });
    }

    // Créer un fichier d'entrée temporaire pour le programme C
    const inputData = createInputFile(nbTaches, durees, arcs);
    const inputFile = path.join(__dirname, 'input_temp.txt');

    fs.writeFileSync(inputFile, inputData);

    // Compiler le programme C (si pas déjà compilé)
    const sourceFile = path.join(__dirname, 'mpm.c');
    const outputFile = path.join(__dirname, 'mpm');

    // Vérifier si le fichier source existe
    if (!fs.existsSync(sourceFile)) {
        return res.status(500).json({
            error: 'Fichier source manquant',
            message: 'Le fichier mpm.c n\'existe pas'
        });
    }

    // Compiler le programme C
    const compile = spawn('gcc', [sourceFile, '-o', outputFile]);

    compile.on('close', (code) => {
        if (code !== 0) {
            return res.status(500).json({
                error: 'Erreur de compilation',
                message: 'Impossible de compiler le programme C'
            });
        }

        // Exécuter le programme C avec le fichier d'entrée
        const process = spawn(outputFile, [], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let errorOutput = '';

        // Écrire les données d'entrée
        process.stdin.write(inputData);
        process.stdin.end();

        process.stdout.on('data', (data) => {
            output += data.toString();
        });

        process.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        process.on('close', (code) => {
            // Nettoyer le fichier temporaire
            if (fs.existsSync(inputFile)) {
                fs.unlinkSync(inputFile);
            }

            if (code !== 0) {
                return res.status(500).json({
                    error: 'Erreur d\'exécution',
                    message: errorOutput || 'Le programme C a rencontré une erreur',
                    output: output
                });
            }

            // Parser la sortie du programme C
            try {
                const resultats = parseOutput(output);
                res.json(resultats);
            } catch (error) {
                res.status(500).json({
                    error: 'Erreur de parsing',
                    message: error.message,
                    output: output
                });
            }
        });
    });
});

// Créer le fichier d'entrée pour le programme C
function createInputFile(nbTaches, durees, arcs) {
    let input = `${nbTaches}\n`;

    // Durées
    durees.forEach(duree => {
        input += `${duree}\n`;
    });

    // Arcs
    for (let i = 0; i < nbTaches; i++) {
        for (let j = 0; j < nbTaches; j++) {
            if (i !== j) {
                input += `${arcs[i][j]}\n`;
            }
        }
    }

    return input;
}

// Parser la sortie du programme C
function parseOutput(output) {
    const lines = output.split('\n');
    const taches = [];
    let cheminCritique = [];

    // Trouver la section des résultats
    let inResults = false;
    let inChemin = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.includes('===== RESULTATS =====')) {
            inResults = true;
            continue;
        }

        if (line.includes('===== CHEMIN CRITIQUE =====')) {
            inChemin = true;
            inResults = false;
            continue;
        }

        if (inResults && line.startsWith('Tache T')) {
            const tacheId = parseInt(line.match(/Tache T(\d+)/)[1]);
            const tache = {
                id: tacheId,
                dtt: 0,
                dtp: 0,
                mtt: 0,
                critique: false
            };

            // Lire les lignes suivantes pour cette tâche
            let j = i + 1;
            while (j < lines.length && !lines[j].includes('Tache T') && !lines[j].includes('=====')) {
                const tacheLine = lines[j].trim();

                if (tacheLine.includes('DTT')) {
                    tache.dtt = parseInt(tacheLine.match(/=\s*(\d+)/)[1]);
                }
                if (tacheLine.includes('DTP')) {
                    tache.dtp = parseInt(tacheLine.match(/=\s*(\d+)/)[1]);
                }
                if (tacheLine.includes('Marge totale')) {
                    tache.mtt = parseInt(tacheLine.match(/=\s*(\d+)/)[1]);
                }
                if (tacheLine.includes('TACHE CRITIQUE')) {
                    tache.critique = true;
                }

                j++;
            }

            taches.push(tache);
        }

        if (inChemin && line.match(/T\d+/)) {
            const matches = line.match(/T(\d+)/g);
            if (matches) {
                cheminCritique = matches.map(t => parseInt(t.substring(1)));
            }
        }
    }

    return {
        taches,
        cheminCritique
    };
}

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`====================================`);
    console.log(`  Serveur MPM démarré avec succès!`);
    console.log(`====================================`);
    console.log(`  URL: http://localhost:${PORT}`);
    console.log(`  API: http://localhost:${PORT}/api/calculer-mpm`);
    console.log(`====================================`);
    console.log(`\nAppuyez sur Ctrl+C pour arrêter le serveur\n`);
});
