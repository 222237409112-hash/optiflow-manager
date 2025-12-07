#include <stdio.h>
#include <stdlib.h>

#define MAX 200
#define INF 1000000000

/* ========= STRUCTURES COMMUNES ========= */
int adj[MAX][MAX];
int durAON[MAX];
int indeg[MAX], outdeg[MAX];
int ES[MAX], EF[MAX], LS[MAX], LF[MAX];
int ve[MAX], vl[MAX];  // pour AOA

int queue[MAX], front, rear;
int n, m;

/* ========= QUEUE ========= */
void initQ() { front = rear = 0; }
void push(int x) { queue[rear++] = x; }
int pop() { return queue[front++]; }
int empty() { return front == rear; }

/* =====================================================
                  MODE AON (durée sur nœud)
   ===================================================== */
void runAON() {
    printf("\n=== MODE AON (Activité sur Nœud) ===\n");

    printf("Entrer le nombre d'activites : ");
    scanf("%d", &n);

    printf("Entrer les durees des activites :\n");
    for (int i = 1; i <= n; i++) {
        scanf("%d", &durAON[i]);
        ES[i] = EF[i] = 0;
        LS[i] = LF[i] = INF;
        indeg[i] = outdeg[i] = 0;
        for (int j = 1; j <= n; j++) adj[i][j] = 0;
    }

    printf("Entrer le nombre de dependances : ");
    scanf("%d", &m);

    printf("Entrer les dependances (u v signifie u avant v) :\n");
    for (int i = 0; i < m; i++) {
        int u, v;
        scanf("%d %d", &u, &v);
        adj[u][v] = 1;
        indeg[v]++;
        outdeg[u]++;
    }

    // Affichage du graphe AON
    printf("\nGraphe AON (Liste des dependances) :\n");
    for (int i = 1; i <= n; i++) {
        printf("Activité %d -> ", i);
        int hasAdj = 0;
        for (int j = 1; j <= n; j++)
            if (adj[i][j]) {
                printf("%d ", j);
                hasAdj = 1;
            }
        if (!hasAdj) printf("aucune");
        printf("\n");
    }

    /* -------- Forward pass (ES/EF) -------- */
    initQ();
    for (int i = 1; i <= n; i++)
        if (indeg[i] == 0) push(i);

    while (!empty()) {
        int u = pop();
        EF[u] = ES[u] + durAON[u];

        for (int v = 1; v <= n; v++)
            if (adj[u][v]) {
                if (ES[v] < EF[u]) ES[v] = EF[u];
                indeg[v]--;
                if (indeg[v] == 0) push(v);
            }
    }

    int project = 0;
    for (int i = 1; i <= n; i++)
        if (EF[i] > project) project = EF[i];

    /* -------- Backward pass (LS/LF) -------- */
    for (int i = 1; i <= n; i++)
        if (outdeg[i] == 0) {
            LF[i] = project;
            LS[i] = project - durAON[i];
        }

    int changed = 1;
    while (changed) {
        changed = 0;
        for (int u = 1; u <= n; u++)
            for (int v = 1; v <= n; v++)
                if (adj[u][v]) {
                    if (LF[u] > LS[v]) {
                        LF[u] = LS[v];
                        LS[u] = LF[u] - durAON[u];
                        changed = 1;
                    }
                }
    }

    /* ----------- RESULTAT ----------- */
    printf("\nACT | Dur | ES | EF | LS | LF | Slack\n");
    for (int i = 1; i <= n; i++) {
        int slack = LS[i] - ES[i];
        printf("%3d | %3d | %3d | %3d | %3d | %3d | %3d\n",
               i, durAON[i], ES[i], EF[i], LS[i], LF[i], slack);
    }

    printf("\nDuree totale du projet = %d\n", project);

    printf("Chemin critique : ");
    for (int i = 1; i <= n; i++)
        if (LS[i] == ES[i]) printf("%d ", i);

    printf("\n");
}

/* =====================================================
                  MODE AOA (durée sur arc)
   ===================================================== */
void runAOA() {
    printf("\n=== MODE AOA (Activité sur Arc) ===\n");

    printf("Entrer le nombre d'evenements : ");
    scanf("%d", &n);

    printf("Entrer le nombre d'activites : ");
    scanf("%d", &m);

    for (int i = 1; i <= n; i++) {
        indeg[i] = outdeg[i] = 0;
        ve[i] = 0;
        vl[i] = INF;
        for (int j = 1; j <= n; j++)
            adj[i][j] = -1;
    }

    printf("Entrer chaque activite (u v duree) :\n");
    for (int i = 0; i < m; i++) {
        int u, v, d;
        scanf("%d %d %d", &u, &v, &d);
        adj[u][v] = d;
        indeg[v]++;
        outdeg[u]++;
    }

    // Affichage du graphe AOA
    printf("\nGraphe AOA (Liste des activites) :\n");
    for (int u = 1; u <= n; u++) {
        int hasAdj = 0;
        for (int v = 1; v <= n; v++) {
            if (adj[u][v] != -1) {
                printf("%d -> %d (dur=%d)\n", u, v, adj[u][v]);
                hasAdj = 1;
            }
        }
        if (!hasAdj) printf("Evenement %d -> aucune activite\n", u);
    }

    /* -------- Forward pass (ve) -------- */
    initQ();
    for (int i = 1; i <= n; i++)
        if (indeg[i] == 0) push(i);

    while (!empty()) {
        int u = pop();
        for (int v = 1; v <= n; v++)
            if (adj[u][v] != -1) {
                if (ve[v] < ve[u] + adj[u][v])
                    ve[v] = ve[u] + adj[u][v];

                indeg[v]--;
                if (indeg[v] == 0) push(v);
            }
    }

    int project = 0;
    for (int i = 1; i <= n; i++)
        if (ve[i] > project) project = ve[i];

    /* -------- Backward pass (vl) -------- */
    for (int i = 1; i <= n; i++)
        if (outdeg[i] == 0)
            vl[i] = project;

    int updated = 1;
    while (updated) {
        updated = 0;
        for (int u = 1; u <= n; u++)
            for (int v = 1; v <= n; v++)
                if (adj[u][v] != -1) {
                    int d = adj[u][v];
                    if (vl[u] > vl[v] - d) {
                        vl[u] = vl[v] - d;
                        updated = 1;
                    }
                }
    }

    /* -------- RESULTAT -------- */
    printf("\nEVT | ve | vl\n");
    for (int i = 1; i <= n; i++)
        printf("%3d | %3d | %3d\n", i, ve[i], vl[i]);

    printf("\nActivites critiques :\n");
    for (int u = 1; u <= n; u++)
        for (int v = 1; v <= n; v++)
            if (adj[u][v] != -1) {
                int w = adj[u][v];
                if (ve[u] == vl[v] - w)
                    printf("%d -> %d (dur=%d)  CRITIQUE\n", u, v, w);
            }

    printf("\nDuree totale du projet = %d\n", project);
}

/* =====================================================
                     PROGRAMME PRINCIPAL
   ===================================================== */
int main() {
    int choix;

    printf("==== PROGRAMME PERT (AON + AOA) ====\n");
    printf("1 - PERT AON (activite sur noeud)\n");
    printf("2 - PERT AOA (activite sur arc)\n");
    printf("Votre choix : ");
    scanf("%d", &choix);

    if (choix == 1) runAON();
    else if (choix == 2) runAOA();
    else printf("Choix invalide.\n");

    return 0;
}
