/* app.js - version améliorée
   - AON / AOA calculs
   - détection cycle
   - export JSON / CSV
   - import JSON
   - dark mode
   - vis-network graph
*/

document.addEventListener('DOMContentLoaded', () => {
    // elements
    const modeForm = document.getElementById('modeForm');
    const aonBlock = document.getElementById('aonBlock'),
        aoaBlock = document.getElementById('aoaBlock');
    const computeBtn = document.getElementById('computeBtn'),
        resetBtn = document.getElementById('resetBtn');
    const exampleBtn = document.getElementById('exampleBtn');
    const status = document.getElementById('status');
    const container = document.getElementById('network');
    const summary = document.getElementById('summary');
    const tableWrap = document.getElementById('tableWrap');
    const ganttWrap = document.getElementById('ganttWrap');

    // top actions
    const toggleTheme = document.getElementById('toggleTheme');
    const btnExportJSON = document.getElementById('btnExportJSON');
    const btnImport = document.getElementById('btnImport');
    const importFile = document.getElementById('importFile');
    const btnExportCSV = document.getElementById('btnExportCSV');

    // network
    let network = null;
    let lastState = null; // store last computed model for export

    // theme
    toggleTheme.addEventListener('click', () => {
        document.body.classList.toggle('dark');
    });

    // import/export
    btnExportJSON.addEventListener('click', () => {
        if (!lastState) return feedback('Aucun projet à exporter.', true);
        const blob = new Blob([JSON.stringify(lastState, null, 2)], { type: 'application/json' });
        downloadBlob(blob, 'pert-project.json');
    });
    btnExportCSV.addEventListener('click', () => {
        if (!lastState) return feedback('Aucun projet à exporter.', true);
        const csv = generateCSVFromState(lastState);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        downloadBlob(blob, 'pert-table.csv');
    });
    document.getElementById('btnImport').addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', (e) => {
        const f = e.target.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const obj = JSON.parse(reader.result);
                loadStateIntoUI(obj);
                feedback('Projet importé.', false);
            } catch (err) {
                feedback('Fichier JSON invalide.', true);
            }
        };
        reader.readAsText(f);
        importFile.value = '';
    });

    // mode toggle
    modeForm.addEventListener('change', () => {
        const mode = modeForm.mode.value;
        if (mode === 'AON') { aonBlock.classList.remove('hidden');
            aoaBlock.classList.add('hidden'); } else { aoaBlock.classList.remove('hidden');
            aonBlock.classList.add('hidden'); }
    });

    // examples / reset
    exampleBtn.addEventListener('click', loadExample);
    resetBtn.addEventListener('click', () => {
        document.getElementById('aonDurations').value = '';
        document.getElementById('aonEdges').value = '';
        document.getElementById('aoaEdges').value = '';
        document.getElementById('aonNodes').value = 5;
        document.getElementById('aoaNodes').value = 6;
        clearAll();
    });

    // compute
    computeBtn.addEventListener('click', () => {
        clearOutput();
        feedback('Calcul en cours...');
        try {
            const mode = modeForm.mode.value;
            if (mode === 'AON') runAON();
            else runAOA();
        } catch (err) {
            feedback('Erreur: ' + err.message, true);
            console.error(err);
        }
    });

    // helpers
    function feedback(msg, isError = false) {
        status.textContent = msg;
        status.style.color = isError ? getComputedStyle(document.documentElement).getPropertyValue('--danger') || '#d23f3f' : '';
    }

    function clearOutput() {
        summary.innerHTML = '';
        tableWrap.innerHTML = '';
        ganttWrap.innerHTML = '';
        if (network) { try { network.destroy(); } catch (e) {}
            network = null; }
    }

    function clearAll() { clearOutput();
        feedback('');
        lastState = null; }

    function downloadBlob(blob, name) {
        const a = document.createElement('a');
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(url);
            a.remove(); }, 1000);
    }

    function loadExample() {
        // fill with example AON values
        document.querySelector('input[name="mode"][value="AON"]').checked = true;
        document.getElementById('aonNodes').value = 5;
        document.getElementById('aonDurations').value = '3,2,4,1,5';
        document.getElementById('aonEdges').value = '1 2\n1 3\n2 4\n3 4\n4 5';
        modeForm.dispatchEvent(new Event('change'));
        feedback('Exemple chargé — appuyez sur Calculer.');
    }

    // parse helpers
    function parseListCSV(s) {
        return s.split(',').map(x => x.trim()).filter(x => x.length).map(Number);
    }

    // Cycle detection (directed)
    function hasCycleDirected(n, edgesList) {
        const g = Array.from({ length: n + 1 }, () => []);
        edgesList.forEach(([u, v]) => g[u].push(v));
        const state = Array(n + 1).fill(0); // 0 unvisited, 1 visiting, 2 done
        let found = false;

        function dfs(u) {
            state[u] = 1;
            for (const v of g[u]) {
                if (state[v] === 0) { dfs(v); if (found) return; } else if (state[v] === 1) { found = true; return; }
            }
            state[u] = 2;
        }
        for (let i = 1; i <= n; i++) { if (state[i] === 0) dfs(i); if (found) return true; }
        return false;
    }

    // AON algorithm
    function runAON() {
        const n = parseInt(document.getElementById('aonNodes').value, 10);
        if (!n || n < 1) throw new Error('n invalide');
        const durations = parseListCSV(document.getElementById('aonDurations').value);
        if (durations.length !== n) throw new Error('Le nombre de durées doit être égal à n.');
        const edgesTxt = document.getElementById('aonEdges').value.trim();
        const edges = edgesTxt.length ? edgesTxt.split('\n').map(l => l.trim().split(/\s+/).map(Number)) : [];

        // verify edges numeric and in range
        for (const [u, v] of edges) {
            if (!u || !v || u < 1 || v < 1 || u > n || v > n) throw new Error('Dépendances invalides (u v) hors intervalle.');
        }

        // cycle check
        if (hasCycleDirected(n, edges)) {
            feedback('Cycle détecté dans les dépendances — corrigez le graphe.', true);
            return;
        }

        // adjacency
        const adj = Array.from({ length: n + 1 }, () => []);
        const indeg = Array(n + 1).fill(0),
            outdeg = Array(n + 1).fill(0);
        edges.forEach(([u, v]) => { adj[u].push(v);
            indeg[v]++;
            outdeg[u]++; });

        // forward ES/EF (topo via Kahn)
        const ES = Array(n + 1).fill(0),
            EF = Array(n + 1).fill(0);
        const q = [];
        const indegCopy = indeg.slice();
        for (let i = 1; i <= n; i++)
            if (indegCopy[i] === 0) q.push(i);
        while (q.length) {
            const u = q.shift();
            EF[u] = ES[u] + durations[u - 1];
            for (const v of adj[u]) {
                if (ES[v] < EF[u]) ES[v] = EF[u];
                indegCopy[v]--;
                if (indegCopy[v] === 0) q.push(v);
            }
        }
        const project = Math.max(...EF);

        // backward LS/LF
        const LS = Array(n + 1).fill(Infinity),
            LF = Array(n + 1).fill(Infinity);
        for (let i = 1; i <= n; i++)
            if (outdeg[i] === 0) { LF[i] = project;
                LS[i] = project - durations[i - 1]; }
        let changed = true;
        while (changed) {
            changed = false;
            for (let u = 1; u <= n; u++) {
                for (const v of adj[u]) {
                    if (LF[u] > LS[v]) {
                        LF[u] = LS[v];
                        LS[u] = LF[u] - durations[u - 1];
                        changed = true;
                    }
                }
            }
        }

        const slack = Array(n + 1).fill(0);
        for (let i = 1; i <= n; i++) slack[i] = LS[i] - ES[i];

        // visualization data
        const nodesVis = [],
            edgesVis = [];
        for (let i = 1; i <= n; i++) {
            const isCrit = (slack[i] === 0);
            nodesVis.push({
                id: i,
                label: `${i}\n(d=${durations[i-1]})`,
                title: `ES:${ES[i]} EF:${EF[i]}\\nLS:${LS[i]} LF:${LF[i]} Slack:${slack[i]}`,
                color: isCrit ? { background: '#ffd6d6', border: '#d23f3f' } : undefined,
                shape: 'box'
            });
            for (const v of adj[i]) edgesVis.push({ from: i, to: v, arrows: 'to' });
        }

        lastState = { mode: 'AON', n, durations, edges, ES, EF, LS, LF, slack, project };
        renderNetwork(nodesVis, edgesVis);
        renderSummaryAON(lastState);
        feedback('Calcul terminé.');
    }

    // AOA algorithm
    function runAOA() {
        const n = parseInt(document.getElementById('aoaNodes').value, 10);
        if (!n || n < 1) throw new Error('n invalide');
        const edgesTxt = document.getElementById('aoaEdges').value.trim();
        if (!edgesTxt) throw new Error('Entrer au moins une activité AOA.');
        const activities = edgesTxt.split('\n').map(l => l.trim().split(/\s+/).map(Number));

        // validate activities
        for (const [u, v, d] of activities) {
            if (!u || !v || typeof d !== 'number' || isNaN(d) || u < 1 || v < 1 || u > n || v > n) throw new Error('Activités AOA invalides (u v d).');
        }

        // detect cycles by building directed graph from activities (u->v)
        if (hasCycleDirected(n, activities.map(([u, v]) => [u, v]))) {
            feedback('Cycle détecté dans AOA — corrigez les activités.', true);
            return;
        }

        const adj = Array.from({ length: n + 1 }, () => []);
        const indeg = Array(n + 1).fill(0),
            outdeg = Array(n + 1).fill(0);
        activities.forEach(([u, v, d]) => { adj[u].push({ v, d });
            indeg[v]++;
            outdeg[u]++; });

        // forward ve
        const ve = Array(n + 1).fill(0);
        const q = [];
        const indegCopy = indeg.slice();
        for (let i = 1; i <= n; i++)
            if (indegCopy[i] === 0) q.push(i);
        while (q.length) {
            const u = q.shift();
            for (const { v, d }
                of adj[u]) {
                if (ve[v] < ve[u] + d) ve[v] = ve[u] + d;
                indegCopy[v]--;
                if (indegCopy[v] === 0) q.push(v);
            }
        }
        const project = Math.max(...ve);

        // backward vl
        const vl = Array(n + 1).fill(Infinity);
        for (let i = 1; i <= n; i++)
            if (outdeg[i] === 0) vl[i] = project;
        let updated = true;
        while (updated) {
            updated = false;
            for (let u = 1; u <= n; u++) {
                for (const { v, d }
                    of adj[u]) {
                    if (vl[u] > vl[v] - d) { vl[u] = vl[v] - d;
                        updated = true; }
                }
            }
        }

        // build vis nodes/edges
        const nodesVis = [];
        for (let i = 1; i <= n; i++) nodesVis.push({ id: i, label: `${i}\n(ve:${ve[i]})`, shape: 'ellipse' });
        const edgesVis = [];
        activities.forEach(([u, v, d]) => {
            const isCrit = (ve[u] === vl[v] - d);
            edgesVis.push({
                from: u,
                to: v,
                label: `${d}`,
                arrows: 'to',
                color: isCrit ? { color: '#d23f3f' } : undefined,
                width: isCrit ? 3 : 1
            });
        });

        lastState = { mode: 'AOA', n, activities, ve, vl, project };
        renderNetwork(nodesVis, edgesVis);
        renderSummaryAOA(lastState);
        feedback('Calcul terminé.');
    }

    // rendering helpers
    function renderNetwork(nodes, edges) {
        if (network) network.destroy();
        const data = { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) };
        const options = {
            nodes: { font: { multi: true }, margin: 8, shapeProperties: { borderRadius: 6 } },
            edges: { smooth: { type: 'dynamic' } },
            layout: { improvedLayout: true },
            physics: { stabilization: true }
        };
        network = new vis.Network(container, data, options);
        network.on("selectNode", params => {
            container.setAttribute('aria-label', `Noeud sélectionné ${params.nodes[0]}`);
        });
    }

    function renderSummaryAON(state) {
        const { n, durations, ES, EF, LS, LF, slack, project } = state;
        summary.innerHTML = `<strong>Durée totale du projet :</strong> ${project}`;
        // table
        let html = `<table><thead><tr><th>Act</th><th>Dur</th><th>ES</th><th>EF</th><th>LS</th><th>LF</th><th>Slack</th></tr></thead><tbody>`;
        for (let i = 1; i <= n; i++) {
            const crit = (slack[i] === 0) ? 'style="background:#fff1f1"' : '';
            html += `<tr ${crit}><td>${i}</td><td>${durations[i-1]}</td><td>${ES[i]}</td><td>${EF[i]}</td><td>${LS[i]}</td><td>${LF[i]}</td><td>${slack[i]}</td></tr>`;
        }
        html += `</tbody></table>`;
        tableWrap.innerHTML = html;
        // gantt
        const items = Array.from({ length: n }, (_, i) => ({ id: i + 1, start: ES[i + 1], duration: durations[i], isCrit: slack[i + 1] === 0 }));
        renderGantt(items, project);
    }

    function renderSummaryAOA(state) {
        const { n, activities, ve, vl, project } = state;
        summary.innerHTML = `<strong>Durée totale du projet :</strong> ${project}`;
        let html = `<table><thead><tr><th>Evt</th><th>ve</th><th>vl</th></tr></thead><tbody>`;
        for (let i = 1; i <= n; i++) html += `<tr><td>${i}</td><td>${ve[i]}</td><td>${isFinite(vl[i])?vl[i]:'-'}</td></tr>`;
        html += `</tbody></table>`;
        tableWrap.innerHTML = html;
        const items = activities.map(([u, v, d], idx) => ({ id: idx + 1, start: ve[u], duration: d, label: `${u}->${v}`, isCrit: (ve[u] === vl[v] - d) }));
        renderGantt(items, project);
    }

    function renderGantt(items, project) {
        ganttWrap.innerHTML = '';
        if (!project || project <= 0) { ganttWrap.textContent = 'Aucune durée à afficher.'; return; }
        const width = Math.max(700, project * 60);
        const height = items.length * 34 + 40;
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', height);

        // grid + tick labels
        const innerWidth = width - 140;
        for (let t = 0; t <= project; t++) {
            const x = 100 + (t / project) * innerWidth;
            const line = document.createElementNS(svgNS, 'line');
            line.setAttribute('x1', x);
            line.setAttribute('x2', x);
            line.setAttribute('y1', 0);
            line.setAttribute('y2', height - 20);
            line.setAttribute('stroke', '#eef3fb');
            line.setAttribute('stroke-width', '1');
            svg.appendChild(line);
            const tx = document.createElementNS(svgNS, 'text');
            tx.setAttribute('x', x);
            tx.setAttribute('y', height - 2);
            tx.setAttribute('font-size', '10');
            tx.setAttribute('text-anchor', 'middle');
            tx.textContent = t;
            svg.appendChild(tx);
        }

        items.forEach((it, idx) => {
            const y = 8 + idx * 30;
            const xpos = 100 + (it.start / project) * innerWidth;
            const w = Math.max(3, (it.duration / project) * innerWidth);
            const rect = document.createElementNS(svgNS, 'rect');
            rect.setAttribute('x', xpos);
            rect.setAttribute('y', y);
            rect.setAttribute('width', w);
            rect.setAttribute('height', 20);
            rect.setAttribute('rx', 6);
            rect.setAttribute('fill', it.isCrit ? '#ffd6d6' : '#e6f0ff');
            rect.setAttribute('stroke', it.isCrit ? '#d23f3f' : '#7aa3ff');
            svg.appendChild(rect);
            const label = document.createElementNS(svgNS, 'text');
            label.setAttribute('x', xpos + 8);
            label.setAttribute('y', y + 14);
            label.setAttribute('font-size', '11');
            label.textContent = it.label ? `${it.label} (${it.duration})` : `Act ${it.id} (${it.duration})`;
            svg.appendChild(label);
        });

        ganttWrap.appendChild(svg);
    }

    // import UI -> state
    function loadStateIntoUI(obj) {
        if (!obj || !obj.mode) throw new Error('JSON non conforme.');
        if (obj.mode === 'AON') {
            document.querySelector('input[name=mode][value=AON]').checked = true;
            document.getElementById('aonNodes').value = obj.n || 1;
            document.getElementById('aonDurations').value = (obj.durations || []).join(',');
            document.getElementById('aonEdges').value = (obj.edges || []).map(e => e.join(' ')).join('\n');
        } else {
            document.querySelector('input[name=mode][value=AOA]').checked = true;
            document.getElementById('aoaNodes').value = obj.n || 1;
            document.getElementById('aoaEdges').value = (obj.activities || []).map(a => a.join(' ')).join('\n');
        }
        modeForm.dispatchEvent(new Event('change'));
        lastState = obj;
    }

    // CSV exporter (simple)
    function generateCSVFromState(state) {
        const rows = [];
        if (state.mode === 'AON') {
            rows.push(['Act', 'Dur', 'ES', 'EF', 'LS', 'LF', 'Slack'].join(','));
            for (let i = 1; i <= state.n; i++) {
                rows.push([i, state.durations[i - 1], state.ES[i], state.EF[i], state.LS[i], state.LF[i], state.slack[i]].join(','));
            }
        } else {
            rows.push(['Evt', 've', 'vl'].join(','));
            for (let i = 1; i <= state.n; i++) {
                rows.push([i, state.ve[i], (isFinite(state.vl[i]) ? state.vl[i] : '')].join(','));
            }
        }
        return rows.join('\n');
    }

});