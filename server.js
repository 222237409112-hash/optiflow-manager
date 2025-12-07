import express from "express";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

const app = express();

// ✅ Utiliser les parsers intégrés d'Express (pas besoin de body-parser!)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
});

// __dirname pour ES module
const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

// Servir les fichiers statiques (HTML, CSS, JS)
app.use(express.static(__dirname));

// Route principale
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "h.html"));
});

// Route Simplexe
app.post("/simplex", (req, res) => {
    const data = req.body;

    // Validation des données
    if (!data || !data.nbVar || !data.nbCtr) {
        return res.status(400).send(" Données invalides : nbVar et nbCtr requis");
    }

    // Déterminer l'exécutable selon l'OS
    const isWindows = process.platform === "win32";
    const exeName = isWindows ? "tp1.exe" : "tp1";
    const exePath = path.join(__dirname, exeName);

    // Vérifier l'existence de l'exécutable
    if (!existsSync(exePath)) {
        return res.status(500).send(
            `❌ Erreur: ${exeName} introuvable.\n\n` +
            `Veuillez compiler tp1.c avec la commande:\n` +
            (isWindows ? `gcc tp1.c -o tp1.exe -lm` : `gcc tp1.c -o tp1 -lm`)
        );
    }

    const proc = spawn(exePath, [], { cwd: __dirname });

    let output = "";
    let errorOutput = "";

    proc.stdout.on("data", (d) => output += d.toString());
    proc.stderr.on("data", (d) => errorOutput += d.toString());

    // Envoyer les données au programme C
    try {
        proc.stdin.write(`${data.type === "max" ? "M" : "N"}\n`);
        proc.stdin.write(`${data.nbVar}\n`);
        proc.stdin.write(`${data.nbCtr}\n`);

        data.objective.forEach(c => proc.stdin.write(`${c}\n`));
        data.constraints.forEach(c => {
            c.coeffs.forEach(a => proc.stdin.write(`${a}\n`));
            proc.stdin.write(`${c.sign}\n`);
            proc.stdin.write(`${c.b}\n`);
        });

        proc.stdin.end();
    } catch (err) {
        return res.status(500).send(` Erreur d'écriture: ${err.message}`);
    }

    proc.on("close", (code) => {
        if (code !== 0 && errorOutput) {
            res.status(500).send(`❌ Erreur d'exécution (code ${code}):\n${errorOutput}`);
        } else {
            res.send(output || "⚠️ Aucune sortie du programme");
        }
    });

    proc.on("error", (err) => {
        res.status(500).send(` Erreur de lancement: ${err.message}`);
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n Serveur Simplexe démarré avec succès!`);
    console.log(`URL: http://localhost:${PORT}`);
    console.log(` Répertoire: ${__dirname}`);
    console.log(` Démarré à: ${new Date().toLocaleString('fr-FR')}\n`);
});