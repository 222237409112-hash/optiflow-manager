const generateBtn = document.getElementById('generateBtn');
const solveBtn = document.getElementById('solveBtn');

generateBtn.addEventListener('click', generateFields);
solveBtn.addEventListener('click', solveSimplex);

function generateFields() {
    const numVars = parseInt(document.getElementById('numVars').value);
    const numConstraints = parseInt(document.getElementById('numConstraints').value);
    if (numVars <= 0 || numConstraints <= 0) { alert('Les valeurs doivent être supérieures à 0'); return; }

    const variablesContainer = document.getElementById('variablesContainer');
    variablesContainer.innerHTML = '<h3>Fonction objectif</h3>';
    for (let i = 1; i <= numVars; i++) {
        variablesContainer.innerHTML += `<input type="number" placeholder="Coefficient x${i}" id="obj_${i}">`;
    }

    const constraintsContainer = document.getElementById('constraintsContainer');
    constraintsContainer.innerHTML = '<h3>Contraintes</h3>';
    for (let j = 1; j <= numConstraints; j++) {
        let row = '<div style="margin-bottom:10px;">';
        for (let i = 1; i <= numVars; i++) {
            row += `<input type="number" placeholder="a${j}${i}" id="c${j}_${i}"> `;
        }
        row += `<select id="sign${j}"><option value="<="><=</option><option value=">=">>=</option><option value="=">=</option></select>`;
        row += `<input type="number" placeholder="b${j}" id="b${j}">`;
        row += '</div>';
        constraintsContainer.innerHTML += row;
    }

    document.getElementById('fieldsCard').style.display = 'block';
    document.getElementById('resultCard').style.display = 'none';
}

function solveSimplex() {
    const numVars = parseInt(document.getElementById('numVars').value);
    const numConstraints = parseInt(document.getElementById('numConstraints').value);

    const objCoeffs = [];
    for (let i = 1; i <= numVars; i++) {
        const val = parseFloat(document.getElementById('obj_' + i).value);
        objCoeffs.push(isNaN(val) ? 0 : val);
    }

    const constraints = [];
    for (let j = 1; j <= numConstraints; j++) {
        const row = [];
        for (let i = 1; i <= numVars; i++) {
            const el = document.getElementById(`c${j}_${i}`);
            const val = el ? parseFloat(el.value) : NaN;
            row.push(isNaN(val) ? 0 : val);
        }
        const signEl = document.getElementById(`sign${j}`);
        const sign = signEl ? signEl.value : "<=";
        const bEl = document.getElementById(`b${j}`);
        const b = bEl ? (parseFloat(bEl.value) || 0) : 0;
        constraints.push({ coeffs: row, sign, b });
    }

    // Build payload expected by backend
    const problemTypeEl = document.getElementById('problemType');
    const type = problemTypeEl ? problemTypeEl.value : 'max';
    const payload = {
        type: type === 'max' ? 'max' : 'min',
        nbVar: numVars,
        nbCtr: numConstraints,
        objective: objCoeffs,
        constraints: constraints
    };

    // Disable solve button while waiting
    solveBtn.disabled = true;
    solveBtn.textContent = 'Résolution...';

    // Call backend API
    fetch('http://localhost:5000/simplex', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(async(resp) => {
            const text = await resp.text();
            document.getElementById('result').innerText = text;
            document.getElementById('resultCard').style.display = 'block';
        })
        .catch((err) => {
            document.getElementById('result').innerText = 'Erreur de communication avec le serveur : ' + err.message;
            document.getElementById('resultCard').style.display = 'block';
        })
        .finally(() => {
            solveBtn.disabled = false;
            solveBtn.textContent = 'Résoudre';
        });
}