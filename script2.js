// ============================================
// CONVERTISSEUR DUAL - VERSION STANDALONE
// Fonctionne sans serveur backend
// Conversion Primal ↔ Dual en JavaScript pur
// ============================================

// ============================================
// INITIALISATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Application Convertisseur Dual initialisée (Mode Standalone)');

    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateFields);
        console.log('✅ Bouton de génération initialisé');
    } else {
        console.error('❌ Bouton generateBtn introuvable');
    }
});

// Délégation d'événement pour le bouton convertir (créé dynamiquement)
document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'solveBtn') {
        console.log('🔄 Bouton convertir cliqué');
        convertDual();
    }
});

// ============================================
// GÉNÉRATION DES CHAMPS DE SAISIE
// ============================================

/**
 * Génère les champs de saisie pour le problème primal
 */
function generateFields() {
    console.log('📋 Génération des champs...');

    const numVars = parseInt(document.getElementById('numVars').value, 10);
    const numConstraints = parseInt(document.getElementById('numConstraints').value, 10);

    // Validation des entrées
    if (!Number.isFinite(numVars) || !Number.isFinite(numConstraints) ||
        numVars <= 0 || numConstraints <= 0 || numVars > 10 || numConstraints > 10) {
        alert('⚠️ Veuillez entrer des valeurs valides (entiers entre 1 et 10)');
        console.warn('⚠️ Validation échouée:', { numVars, numConstraints });
        return;
    }

    console.log(`✅ Génération: ${numVars} variables, ${numConstraints} contraintes`);

    // Générer les champs
    generateObjectiveFunction(numVars);
    generateConstraints(numVars, numConstraints);

    // Afficher la section des champs
    const fieldsCard = document.getElementById('fieldsCard');
    const resultCard = document.getElementById('resultCard');

    if (fieldsCard) fieldsCard.style.display = 'block';
    if (resultCard) resultCard.style.display = 'none';

    // Scroll fluide vers les champs
    setTimeout(() => {
        fieldsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

/**
 * Génère les champs pour la fonction objectif
 */
function generateObjectiveFunction(numVars) {
    console.log('🎯 Génération fonction objectif');

    const container = document.getElementById('variablesContainer');
    if (!container) {
        console.error('❌ Container variablesContainer introuvable');
        return;
    }

    container.innerHTML = '<h3 style="margin-bottom: 15px; color: #667eea;">Fonction Objectif</h3>';

    const objDiv = document.createElement('div');
    objDiv.className = 'inline-controls';

    for (let i = 1; i <= numVars; i++) {
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.gap = '5px';

        const label = document.createElement('label');
        label.textContent = `c${i}`;
        label.style.fontSize = '0.85rem';
        label.style.fontWeight = '600';
        label.htmlFor = `obj_${i}`;

        const input = document.createElement('input');
        input.type = 'number';
        input.step = 'any';
        input.placeholder = `0`;
        input.id = `obj_${i}`;
        input.value = '0';
        input.title = `Coefficient de x${i}`;

        wrapper.appendChild(label);
        wrapper.appendChild(input);
        objDiv.appendChild(wrapper);
    }

    container.appendChild(objDiv);
    console.log(`✅ ${numVars} champs objectif créés`);
}

/**
 * Génère les champs pour les contraintes
 */
function generateConstraints(numVars, numConstraints) {
    console.log('🔗 Génération contraintes');

    const container = document.getElementById('constraintsContainer');
    if (!container) {
        console.error('❌ Container constraintsContainer introuvable');
        return;
    }

    container.innerHTML = '<h3 style="margin-bottom: 15px; color: #667eea;">Contraintes</h3>';

    for (let j = 1; j <= numConstraints; j++) {
        const row = document.createElement('div');
        row.className = 'constraint-row';

        // Label de la contrainte
        const label = document.createElement('span');
        label.textContent = `C${j}:`;
        label.style.fontWeight = '600';
        label.style.minWidth = '45px';
        label.style.color = '#667eea';
        row.appendChild(label);

        // Coefficients a_ij
        for (let i = 1; i <= numVars; i++) {
            const input = document.createElement('input');
            input.type = 'number';
            input.step = 'any';
            input.placeholder = `a${j}${i}`;
            input.id = `c${j}_${i}`;
            input.value = '0';
            input.title = `Coefficient a${j}${i}`;
            row.appendChild(input);
        }

        // Sélecteur de signe
        const select = document.createElement('select');
        select.id = `sign${j}`;
        select.style.width = '70px';

        const opt1 = document.createElement('option');
        opt1.value = '<=';
        opt1.textContent = '≤';

        const opt2 = document.createElement('option');
        opt2.value = '>=';
        opt2.textContent = '≥';

        const opt3 = document.createElement('option');
        opt3.value = '=';
        opt3.textContent = '=';

        select.appendChild(opt1);
        select.appendChild(opt2);
        select.appendChild(opt3);
        row.appendChild(select);

        // Second membre b_j
        const bInput = document.createElement('input');
        bInput.type = 'number';
        bInput.step = 'any';
        bInput.placeholder = `b${j}`;
        bInput.id = `b${j}`;
        bInput.value = '0';
        bInput.title = `Second membre b${j}`;
        bInput.style.width = '80px';
        row.appendChild(bInput);

        container.appendChild(row);
    }

    console.log(`✅ ${numConstraints} contraintes créées`);
}

// ============================================
// CONVERSION EN DUAL (LOGIQUE PURE JS)
// ============================================

/**
 * Fonction principale de conversion primal -> dual
 */
function convertDual() {
    console.log('🚀 Début de la conversion (mode standalone)');

    const n = parseInt(document.getElementById('numVars').value, 10);
    const m = parseInt(document.getElementById('numConstraints').value, 10);
    const primalType = document.getElementById('problemType').value;

    // Validation
    if (!n || !m) {
        alert('⚠️ Veuillez d\'abord générer les champs');
        console.warn('⚠️ Pas de champs générés');
        return;
    }

    console.log(`📊 Problème: ${primalType}, ${n} vars, ${m} contraintes`);

    // Collecter les données du formulaire
    const c = collectObjectiveCoefficients(n);
    const constraints = collectConstraints(n, m);

    const solveBtn = document.getElementById('solveBtn');
    if (!solveBtn) {
        console.error('❌ Bouton solveBtn introuvable');
        return;
    }

    // Désactiver le bouton et afficher le loader
    solveBtn.disabled = true;
    solveBtn.innerHTML = 'Conversion en cours... <span class="loading"></span>';

    try {
        // Effectuer la conversion du dual
        const dualProblem = computeDual(primalType, n, m, c, constraints);

        // Afficher les résultats
        displayDualResult(primalType, n, m, c, constraints, dualProblem);
        console.log('✅ Conversion et affichage terminés');

    } catch (error) {
        console.error('❌ Erreur lors de la conversion:', error);
        displayError(error.message);
    } finally {
        // Réactiver le bouton
        solveBtn.disabled = false;
        solveBtn.innerHTML = '🚀 Convertir en Dual';
    }

    // Scroll vers les résultats
    setTimeout(() => {
        const resultCard = document.getElementById('resultCard');
        if (resultCard) {
            resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
}

/**
 * Algorithme de conversion primal -> dual
 * Applique les règles de la théorie de la dualité en programmation linéaire
 */
function computeDual(primalType, n, m, c, constraints) {
    console.log('🔄 Calcul du dual...');

    // Extraire les composantes du problème primal
    const A = constraints.map(ctr => ctr.coeffs);
    const b = constraints.map(ctr => ctr.b);
    const signs = constraints.map(ctr => ctr.sign);

    // Règle 1: Type du dual (inverse du primal)
    // max -> min, min -> max
    const dualType = primalType === 'max' ? 'min' : 'max';

    // Règle 2: Transposition de la matrice A
    // A_dual[i][j] = A[j][i]
    const A_dual = [];
    for (let i = 0; i < n; i++) {
        A_dual[i] = [];
        for (let j = 0; j < m; j++) {
            A_dual[i][j] = A[j][i];
        }
    }

    // Règle 3: Échange c ↔ b
    // - Les coefficients de la fonction objectif duale = b primal
    // - Les seconds membres des contraintes duales = c primal
    const c_dual = [...b];
    const b_dual = [...c];

    // Règle 4: Déterminer les signes des variables duales
    // Dépend du type du primal et des signes des contraintes
    const ySigns = signs.map(s => {
        if (primalType === 'max') {
            // Problème de maximisation:
            if (s === '<=') return '≥ 0'; // contrainte ≤ -> variable ≥ 0
            if (s === '>=') return '≤ 0'; // contrainte ≥ -> variable ≤ 0
            return 'libre'; // contrainte = -> variable libre
        } else {
            // Problème de minimisation:
            if (s === '<=') return '≤ 0'; // contrainte ≤ -> variable ≤ 0
            if (s === '>=') return '≥ 0'; // contrainte ≥ -> variable ≥ 0
            return 'libre'; // contrainte = -> variable libre
        }
    });

    // Règle 5: Sens des contraintes duales
    // max -> contraintes duales ≥
    // min -> contraintes duales ≤
    const dualConstraintSense = primalType === 'max' ? '≥' : '≤';

    // Vérification: Le primal est-il en forme canonique ?
    let isCanonical = true;
    for (let j = 0; j < m; j++) {
        // Vérifier le signe des contraintes
        if (primalType === 'max' && signs[j] !== '<=') {
            isCanonical = false;
            break;
        }
        if (primalType === 'min' && signs[j] !== '>=') {
            isCanonical = false;
            break;
        }
        // Vérifier que b ≥ 0
        if (b[j] < 0) {
            isCanonical = false;
            break;
        }
    }

    return {
        type: dualType,
        n: m, // Le dual a m variables (autant que de contraintes du primal)
        m: n, // Le dual a n contraintes (autant que de variables du primal)
        A: A_dual,
        b: b_dual,
        c: c_dual,
        ySigns: ySigns,
        constraintSense: dualConstraintSense,
        isCanonical: isCanonical
    };
}

// ============================================
// COLLECTE DES DONNÉES DU FORMULAIRE
// ============================================

/**
 * Collecte les coefficients de la fonction objectif
 */
function collectObjectiveCoefficients(n) {
    const c = [];
    for (let i = 1; i <= n; i++) {
        const elem = document.getElementById(`obj_${i}`);
        if (!elem) {
            console.warn(`⚠️ Élément obj_${i} introuvable`);
            c.push(0);
            continue;
        }
        const value = parseFloat(elem.value);
        c.push(Number.isFinite(value) ? value : 0);
    }
    console.log('📊 Coefficients objectif:', c);
    return c;
}

/**
 * Collecte toutes les contraintes
 */
function collectConstraints(n, m) {
    const constraints = [];

    for (let j = 1; j <= m; j++) {
        const coeffs = [];

        // Collecter les coefficients a_ij
        for (let i = 1; i <= n; i++) {
            const elem = document.getElementById(`c${j}_${i}`);
            if (!elem) {
                console.warn(`⚠️ Élément c${j}_${i} introuvable`);
                coeffs.push(0);
                continue;
            }
            const value = parseFloat(elem.value);
            coeffs.push(Number.isFinite(value) ? value : 0);
        }

        // Collecter le second membre b_j
        const bElem = document.getElementById(`b${j}`);
        const b = bElem ? parseFloat(bElem.value) : 0;

        // Collecter le signe de la contrainte
        const signElem = document.getElementById(`sign${j}`);
        const sign = signElem ? signElem.value : '<=';

        constraints.push({
            coeffs: coeffs,
            sign: sign,
            b: Number.isFinite(b) ? b : 0
        });
    }

    console.log('📊 Contraintes:', constraints);
    return constraints;
}

// ============================================
// AFFICHAGE DES RÉSULTATS
// ============================================

/**
 * Affiche le résultat complet de la conversion
 */
function displayDualResult(primalType, primal_n, primal_m, primal_c, primal_constraints, dual) {
    console.log('🎨 Affichage des résultats');

    // Générer le texte de sortie formaté
    const outputText = generateOutputText(primalType, primal_n, primal_m, primal_c, primal_constraints, dual);

    // Créer le HTML du résumé
    const summaryHtml = `
        <div class="success-box">
            <h3>✅ Conversion Réussie</h3>
            <p><strong>Primal:</strong> ${primalType === 'max' ? 'Maximisation' : 'Minimisation'} (${primal_n} variables, ${primal_m} contraintes)</p>
            <p><strong>Dual:</strong> ${dual.type === 'min' ? 'Minimisation' : 'Maximisation'} (${dual.n} variables, ${dual.m} contraintes)</p>
        </div>
        <div class="output-box">
            <h4 style="margin-bottom: 10px; color: #e2e8f0;">📋 Formulation du Dual:</h4>
            <pre>${escapeHtml(outputText)}</pre>
        </div>
    `;

    const summaryContainer = document.getElementById('resultSummary');
    if (summaryContainer) {
        summaryContainer.innerHTML = summaryHtml;
    }

    // Afficher la formulation graphique
    displayGraphicalDual(primalType, primal_n, primal_m, primal_constraints, primal_c, dual);

    // Afficher la carte des résultats
    const resultCard = document.getElementById('resultCard');
    if (resultCard) {
        resultCard.style.display = 'block';
    }
}

/**
 * Génère le texte formaté du problème dual
 */
function generateOutputText(primalType, n, m, c, constraints, dual) {
    let output = '';

    output += '=== Programme dual ===\n';
    output += `Type: ${dual.type === 'min' ? 'Minimisation' : 'Maximisation'}\n\n`;

    // Fonction objectif
    output += 'Fonction objectif : ';
    for (let i = 0; i < dual.n; i++) {
        const coef = dual.c[i];
        if (i === 0) {
            output += `${formatNumber(coef)}*y${i + 1}`;
        } else {
            output += coef >= 0 ? ` +${formatNumber(coef)}*y${i + 1}` : ` ${formatNumber(coef)}*y${i + 1}`;
        }
    }
    output += '\n\n';

    // Contraintes duales
    output += 'Contraintes duales :\n';
    for (let i = 0; i < dual.m; i++) {
        output += '  ';
        for (let j = 0; j < dual.n; j++) {
            const coef = dual.A[i][j];
            if (j === 0) {
                output += `${formatNumber(coef)}*y${j + 1}`;
            } else {
                output += coef >= 0 ? ` +${formatNumber(coef)}*y${j + 1}` : ` ${formatNumber(coef)}*y${j + 1}`;
            }
        }
        output += ` ${dual.constraintSense} ${formatNumber(dual.b[i])}\n`;
    }
    output += '\n';

    // Signes des variables duales
    output += 'Signes des variables duales :\n';
    for (let j = 0; j < dual.n; j++) {
        output += `  y${j + 1} ${dual.ySigns[j]}\n`;
    }
    output += '\n';

    // Forme canonique
    output += `Forme canonique primal : ${dual.isCanonical ? 'Oui' : 'Non'}\n`;

    return output;
}

/**
 * Affiche la formulation graphique sous forme de tableaux
 */
function displayGraphicalDual(primalType, n, m, constraints, c, dual) {
    console.log('📈 Affichage formulation graphique');

    const A = constraints.map(ctr => ctr.coeffs);
    const b = constraints.map(ctr => ctr.b);
    const signs = constraints.map(ctr => ctr.sign);

    // Construire la fonction objectif avec formatage correct
    const objectiveTerms = dual.c.map((coef, j) => {
        const num = formatNumber(coef);
        const numValue = parseFloat(num);
        if (j === 0) {
            return `${num}·y${j + 1}`;
        }
        return numValue >= 0 ? ` + ${num}·y${j + 1}` : ` ${num}·y${j + 1}`;
    }).join('');

    let html = `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-top: 20px;">
            <h4 style="color: #667eea; margin-bottom: 15px;">📊 Formulation Graphique du Dual</h4>
            <p style="font-weight: 600; margin-bottom: 20px; font-size: 1.1rem;">
                <strong>${dual.type === 'min' ? 'Minimiser' : 'Maximiser'}</strong> W = ${objectiveTerms}
            </p>
            
            <h4 style="margin-top: 20px; margin-bottom: 10px;">Contraintes Duales:</h4>
            <table>
                <thead>
                    <tr>
                        <th>Variable Primal</th>
                        <th>Contrainte Duale</th>
                        <th></th>
                        <th>RHS</th>
                    </tr>
                </thead>
                <tbody>
    `;

    // Générer les contraintes duales
    for (let i = 0; i < n; i++) {
        const terms = [];
        for (let j = 0; j < m; j++) {
            const coef = formatNumber(A[j][i]);
            const coefValue = parseFloat(coef);
            if (j === 0) {
                terms.push(`${coef}·y${j + 1}`);
            } else {
                terms.push(coefValue >= 0 ? ` + ${coef}·y${j + 1}` : ` ${coef}·y${j + 1}`);
            }
        }
        html += `
            <tr>
                <td><strong>x${i + 1}</strong></td>
                <td style="text-align: left; padding-left: 20px;">${terms.join('')}</td>
                <td><strong>${dual.constraintSense}</strong></td>
                <td><strong>${formatNumber(c[i])}</strong></td>
            </tr>
        `;
    }

    html += `
                </tbody>
            </table>
            
            <h4 style="margin-top: 20px; margin-bottom: 10px;">Signes des Variables Duales:</h4>
            <table>
                <thead>
                    <tr>
                        <th>Variable Duale</th>
                        <th>Contrainte Primal</th>
                        <th>Signe</th>
                    </tr>
                </thead>
                <tbody>
    `;

    // Tableau des signes
    for (let j = 0; j < m; j++) {
        html += `
            <tr>
                <td><strong>y${j + 1}</strong></td>
                <td>${escapeHtml(signs[j])}</td>
                <td><strong>${escapeHtml(dual.ySigns[j])}</strong></td>
            </tr>
        `;
    }

    html += `
                </tbody>
            </table>
            
            <div style="margin-top: 20px; padding: 15px; background: ${dual.isCanonical ? '#d4edda' : '#fff3cd'}; border-radius: 8px;">
                <strong>Forme Canonique du Primal:</strong> ${dual.isCanonical ? '✅ Oui' : '⚠️ Non'}
            </div>
        </div>
    `;

    const tableContainer = document.getElementById('resultTable');
    if (tableContainer) {
        tableContainer.innerHTML = html;
    }
}

/**
 * Affiche un message d'erreur
 */
function displayError(message) {
    console.log('❌ Affichage de l\'erreur');

    const errorHtml = `
        <div class="error-box">
            <strong>❌ Erreur:</strong> ${escapeHtml(message)}
        </div>
    `;

    const summaryContainer = document.getElementById('resultSummary');
    const tableContainer = document.getElementById('resultTable');
    const resultCard = document.getElementById('resultCard');

    if (summaryContainer) summaryContainer.innerHTML = errorHtml;
    if (tableContainer) tableContainer.innerHTML = '';
    if (resultCard) resultCard.style.display = 'block';
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Formate un nombre pour l'affichage
 * Arrondit les entiers, limite les décimales à 2 chiffres
 */
function formatNumber(x) {
    if (!Number.isFinite(x)) return '0';

    // Si très proche d'un entier, l'arrondir
    if (Math.abs(Math.round(x) - x) < 1e-10) {
        return String(Math.round(x));
    }

    // Sinon, limiter à 2 décimales
    return x.toFixed(2);
}

/**
 * Échappe les caractères HTML pour éviter les injections XSS
 */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    if (typeof str === 'number') return String(str);

    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ============================================
// MESSAGE DE CHARGEMENT
// ============================================
console.log('✅ Script chargé avec succès (Mode Standalone - Sans serveur)');