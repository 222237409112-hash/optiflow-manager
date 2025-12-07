// Variables globales
let nbTaches = 0;
let durees = [];
let arcs = [];

// Navigation entre les étapes
function showStep(stepNumber) {
    // Masquer toutes les étapes
    document.querySelectorAll('.step-container').forEach(step => {
        step.classList.remove('active');
    });

    // Afficher l'étape sélectionnée
    document.getElementById(`step${stepNumber}`).classList.add('active');

    // Mettre à jour la barre de progression
    for (let i = 1; i <= 4; i++) {
        const progressStep = document.getElementById(`progress${i}`);
        if (i <= stepNumber) {
            progressStep.classList.add('active');
        } else {
            progressStep.classList.remove('active');
        }
    }
}

// Étape 1 -> Étape 2
function goToStep2() {
    const input = document.getElementById('nbTaches');
    nbTaches = parseInt(input.value);

    if (!nbTaches || nbTaches < 1 || nbTaches > 20) {
        alert('Veuillez entrer un nombre de tâches valide (entre 1 et 20)');
        return;
    }

    // Initialiser les tableaux
    durees = new Array(nbTaches).fill(0);
    arcs = Array(nbTaches).fill(null).map(() => Array(nbTaches).fill(-1));

    // Créer les champs de durée
    const container = document.getElementById('dureesContainer');
    container.innerHTML = '';

    for (let i = 0; i < nbTaches; i++) {
        const div = document.createElement('div');
        div.className = 'duree-item';
        div.innerHTML = `
            <label>T${i}:</label>
            <input type="number" min="0" id="duree${i}" placeholder="Durée" value="0">
        `;
        container.appendChild(div);
    }

    showStep(2);
}

// Étape 2 -> Étape 3
function goToStep3() {
    // Récupérer les durées
    for (let i = 0; i < nbTaches; i++) {
        const value = document.getElementById(`duree${i}`).value;
        durees[i] = parseInt(value) || 0;
    }

    // Créer la table des dépendances
    createDependancesTable();

    // Afficher le graphe initial
    setTimeout(() => {
        updateGraphDisplay();
    }, 100);

    showStep(3);
}

// Créer la table des dépendances
function createDependancesTable() {
    const table = document.getElementById('dependancesTable');
    table.innerHTML = '';

    // En-tête
    const thead = document.createElement('thead');
    let headerRow = '<tr><th>De / Vers</th>';
    for (let i = 0; i < nbTaches; i++) {
        headerRow += `<th>T${i}</th>`;
    }
    headerRow += '</tr>';
    thead.innerHTML = headerRow;
    table.appendChild(thead);

    // Corps
    const tbody = document.createElement('tbody');
    for (let i = 0; i < nbTaches; i++) {
        const row = document.createElement('tr');
        row.innerHTML = `<th>T${i}</th>`;

        for (let j = 0; j < nbTaches; j++) {
            const td = document.createElement('td');
            if (i === j) {
                td.innerHTML = '<div style="width: 60px; height: 40px; background: #e2e8f0; display: flex; align-items: center; justify-content: center; color: #a0aec0;">·</div>';
            } else {
                td.innerHTML = `<input type="number" id="arc_${i}_${j}" value="-1" onchange="updateArc(${i}, ${j}, this.value)">`;
            }
            row.appendChild(td);
        }
        tbody.appendChild(row);
    }
    table.appendChild(tbody);

    // Afficher le graphe
    updateGraphDisplay();
}

// Mettre à jour un arc
function updateArc(i, j, value) {
    arcs[i][j] = parseInt(value) || -1;
    updateGraphDisplay();
}

// Afficher le graphe
function updateGraphDisplay() {
    // Afficher la carte du graphe
    document.getElementById('grapheCard').style.display = 'block';

    // Dessiner le graphe sur canvas
    drawGraph('graphCanvas');

    // Matrice d'adjacence
    const matriceTable = document.getElementById('matriceTable');
    matriceTable.innerHTML = '';

    const thead = document.createElement('thead');
    let headerRow = '<tr><th></th>';
    for (let i = 0; i < nbTaches; i++) {
        headerRow += `<th>T${i}</th>`;
    }
    headerRow += '</tr>';
    thead.innerHTML = headerRow;
    matriceTable.appendChild(thead);

    const tbody = document.createElement('tbody');
    for (let i = 0; i < nbTaches; i++) {
        const row = document.createElement('tr');
        row.innerHTML = `<th>T${i}</th>`;

        for (let j = 0; j < nbTaches; j++) {
            const td = document.createElement('td');
            td.textContent = arcs[i][j] === -1 ? '·' : arcs[i][j];
            row.appendChild(td);
        }
        tbody.appendChild(row);
    }
    matriceTable.appendChild(tbody);

    // Liste des arcs
    const arcsList = document.getElementById('arcsList');
    arcsList.innerHTML = '';

    let hasArcs = false;
    for (let i = 0; i < nbTaches; i++) {
        for (let j = 0; j < nbTaches; j++) {
            if (arcs[i][j] !== -1) {
                hasArcs = true;
                const div = document.createElement('div');
                div.className = 'arc-item';
                div.innerHTML = `
                    <span class="from">T${i}</span>
                    <span class="arrow">→</span>
                    <span class="to">T${j}</span>
                    <span class="poids">(poids = ${arcs[i][j]})</span>
                `;
                arcsList.appendChild(div);
            }
        }
    }

    if (!hasArcs) {
        arcsList.innerHTML = '<p class="no-arcs">Aucun arc défini</p>';
    }
}

// Dessiner le graphe sur le canvas
function drawGraph(canvasId, criticalPath = []) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error('Canvas non trouvé:', canvasId);
        return;
    }

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Effacer le canvas
    ctx.clearRect(0, 0, width, height);

    // Fond blanc
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Grille légère
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
    }
    for (let i = 0; i < height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
    }

    // Calculer les positions des nœuds
    const positions = calculateNodePositions(nbTaches, width, height);

    // Dessiner les arcs d'abord
    for (let i = 0; i < nbTaches; i++) {
        for (let j = 0; j < nbTaches; j++) {
            if (arcs[i][j] !== -1) {
                const isCritical = criticalPath.includes(i) && criticalPath.includes(j) &&
                    criticalPath.indexOf(j) === criticalPath.indexOf(i) + 1;
                drawArc(ctx, positions[i], positions[j], arcs[i][j], isCritical);
            }
        }
    }

    // Dessiner les nœuds
    for (let i = 0; i < nbTaches; i++) {
        const isCritical = criticalPath.includes(i);
        drawNode(ctx, positions[i], i, isCritical);
    }

    console.log('Graphe dessiné avec succès sur', canvasId);
}

// Calculer les positions des nœuds
function calculateNodePositions(n, width, height) {
    const positions = [];
    const margin = 80;
    const usableWidth = width - 2 * margin;
    const usableHeight = height - 2 * margin;

    if (n <= 4) {
        // Disposition horizontale
        const spacing = usableWidth / (n + 1);
        for (let i = 0; i < n; i++) {
            positions.push({
                x: margin + spacing * (i + 1),
                y: height / 2
            });
        }
    } else {
        // Disposition en grille
        const cols = Math.ceil(Math.sqrt(n));
        const rows = Math.ceil(n / cols);
        const spacingX = usableWidth / (cols + 1);
        const spacingY = usableHeight / (rows + 1);

        for (let i = 0; i < n; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            positions.push({
                x: margin + spacingX * (col + 1),
                y: margin + spacingY * (row + 1)
            });
        }
    }

    return positions;
}

// Dessiner un arc
function drawArc(ctx, from, to, weight, isCritical) {
    ctx.save();

    // Style de la flèche
    ctx.strokeStyle = isCritical ? '#f56565' : '#667eea';
    ctx.lineWidth = isCritical ? 3 : 2;
    ctx.fillStyle = isCritical ? '#f56565' : '#667eea';

    // Calculer l'angle
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx);

    // Réduire la longueur pour ne pas toucher les cercles
    const nodeRadius = 35;
    const startX = from.x + Math.cos(angle) * nodeRadius;
    const startY = from.y + Math.sin(angle) * nodeRadius;
    const endX = to.x - Math.cos(angle) * nodeRadius;
    const endY = to.y - Math.sin(angle) * nodeRadius;

    // Dessiner la ligne
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Dessiner la pointe de la flèche
    const arrowSize = 12;
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
        endX - arrowSize * Math.cos(angle - Math.PI / 6),
        endY - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
        endX - arrowSize * Math.cos(angle + Math.PI / 6),
        endY - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();

    // Afficher le poids au milieu
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    // Fond blanc pour le texte
    ctx.fillStyle = 'white';
    ctx.fillRect(midX - 15, midY - 12, 30, 24);

    ctx.fillStyle = isCritical ? '#f56565' : '#667eea';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(weight, midX, midY);

    ctx.restore();
}

// Dessiner un nœud
function drawNode(ctx, pos, id, isCritical) {
    ctx.save();

    const radius = 35;

    // Ombre
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Cercle extérieur
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = isCritical ? '#fff5f5' : '#ffffff';
    ctx.fill();
    ctx.strokeStyle = isCritical ? '#f56565' : '#667eea';
    ctx.lineWidth = isCritical ? 4 : 3;
    ctx.stroke();

    ctx.shadowColor = 'transparent';

    // Texte "Tâche"
    ctx.fillStyle = '#4a5568';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Tâche', pos.x, pos.y - 8);

    // Numéro de la tâche
    ctx.fillStyle = isCritical ? '#f56565' : '#667eea';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`T${id}`, pos.x, pos.y + 10);

    ctx.restore();
}

// Calculer DTT (Date au plus tôt)
function calculerDTT() {
    const dtt = new Array(nbTaches).fill(0);

    for (let i = 0; i < nbTaches; i++) {
        for (let j = 0; j < nbTaches; j++) {
            if (arcs[j][i] !== -1) {
                const val = dtt[j] + arcs[j][i];
                if (val > dtt[i]) {
                    dtt[i] = val;
                }
            }
        }
    }

    return dtt;
}

// Calculer DTP (Date au plus tard)
function calculerDTP(dtt) {
    // Trouver la fin du projet
    let finProjet = 0;
    for (let i = 0; i < nbTaches; i++) {
        const fin = dtt[i] + durees[i];
        if (fin > finProjet) {
            finProjet = fin;
        }
    }

    const dtp = durees.map((d, i) => finProjet - d);

    for (let i = nbTaches - 1; i >= 0; i--) {
        for (let j = 0; j < nbTaches; j++) {
            if (arcs[i][j] !== -1) {
                const val = dtp[j] - arcs[i][j];
                if (val < dtp[i]) {
                    dtp[i] = val;
                }
            }
        }
    }

    return dtp;
}

// Calculer et afficher les résultats
function calculerResultats() {
    const dtt = calculerDTT();
    const dtp = calculerDTP(dtt);

    // Calculer la durée totale du projet
    const dureeProjet = Math.max(...dtt.map((d, i) => d + durees[i]));

    // Créer les objets tâches
    const taches = durees.map((duree, i) => ({
        id: i,
        duree: duree,
        dtt: dtt[i],
        dtp: dtp[i],
        mtt: dtp[i] - dtt[i],
        critique: dtp[i] - dtt[i] === 0
    }));

    // Chemin critique
    const cheminCritique = taches.filter(t => t.critique).map(t => t.id);

    // Afficher les résultats
    afficherResultats(taches, cheminCritique, dureeProjet);

    // Dessiner le graphe avec chemin critique après un court délai
    setTimeout(() => {
        drawGraph('resultsGraphCanvas', cheminCritique);
    }, 100);

    showStep(4);
}

// Afficher les résultats
function afficherResultats(taches, cheminCritique, dureeProjet) {
    // Afficher la matrice dans l'étape 4
    const matriceTable = document.getElementById('resultsMatriceTable');
    matriceTable.innerHTML = '';

    const thead = document.createElement('thead');
    let headerRow = '<tr><th></th>';
    for (let i = 0; i < nbTaches; i++) {
        headerRow += `<th>T${i}</th>`;
    }
    headerRow += '</tr>';
    thead.innerHTML = headerRow;
    matriceTable.appendChild(thead);

    const tbody = document.createElement('tbody');
    for (let i = 0; i < nbTaches; i++) {
        const row = document.createElement('tr');
        row.innerHTML = `<th>T${i}</th>`;

        for (let j = 0; j < nbTaches; j++) {
            const td = document.createElement('td');
            td.textContent = arcs[i][j] === -1 ? '·' : arcs[i][j];
            row.appendChild(td);
        }
        tbody.appendChild(row);
    }
    matriceTable.appendChild(tbody);

    // Afficher la liste des arcs
    const arcsList = document.getElementById('resultsArcsList');
    arcsList.innerHTML = '';

    let hasArcs = false;
    for (let i = 0; i < nbTaches; i++) {
        for (let j = 0; j < nbTaches; j++) {
            if (arcs[i][j] !== -1) {
                hasArcs = true;
                const div = document.createElement('div');
                div.className = 'arc-item';
                div.innerHTML = `
                    <span class="from">T${i}</span>
                    <span class="arrow">→</span>
                    <span class="to">T${j}</span>
                    <span class="poids">(poids = ${arcs[i][j]})</span>
                `;
                arcsList.appendChild(div);
            }
        }
    }

    if (!hasArcs) {
        arcsList.innerHTML = '<p class="no-arcs">Aucun arc défini</p>';
    }

    // Afficher les tâches
    const container = document.getElementById('resultatsContainer');
    container.innerHTML = '';

    taches.forEach(tache => {
        const div = document.createElement('div');
        div.className = `tache-card ${tache.critique ? 'critique' : 'normal'}`;
        div.innerHTML = `
            <div class="tache-header">
                <h4>Tâche T${tache.id}</h4>
                ${tache.critique ? '<span class="badge-critique">CRITIQUE</span>' : ''}
            </div>
            <div class="tache-details">
                <p><strong>Durée:</strong> ${tache.duree}</p>
                <p><strong>DTT:</strong> ${tache.dtt}</p>
                <p><strong>DTP:</strong> ${tache.dtp}</p>
                <p><strong>Marge totale:</strong> ${tache.mtt}</p>
            </div>
        `;
        container.appendChild(div);
    });

    // Afficher le chemin critique
    const cheminContainer = document.getElementById('cheminCritique');
    cheminContainer.innerHTML = '';

    const cheminDiv = document.createElement('div');
    cheminDiv.className = 'chemin-container';

    cheminCritique.forEach((id, index) => {
        const span = document.createElement('span');
        span.className = 'chemin-tache';
        span.textContent = `T${id}`;
        cheminDiv.appendChild(span);

        if (index < cheminCritique.length - 1) {
            const arrow = document.createElement('span');
            arrow.className = 'chemin-arrow';
            arrow.textContent = '→';
            cheminDiv.appendChild(arrow);
        }
    });

    cheminContainer.appendChild(cheminDiv);

    // Afficher la durée du projet
    document.getElementById('dureeProjet').textContent =
        `Durée minimale du projet: ${dureeProjet} unités de temps`;

    console.log('Résultats affichés, graphe devrait être visible');
}

// Recommencer
function recommencer() {
    nbTaches = 0;
    durees = [];
    arcs = [];

    document.getElementById('nbTaches').value = '';
    document.getElementById('dureesContainer').innerHTML = '';
    document.getElementById('dependancesTable').innerHTML = '';
    document.getElementById('grapheCard').style.display = 'none';

    showStep(1);
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    showStep(1);
});