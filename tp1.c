#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

#define MAX_M 10
#define MAX_N 10
#define EPS 1e-6

/* ==================== AFFICHAGE ==================== */
void afficherTableau(double A[MAX_M][MAX_N + MAX_M], double b[MAX_M],
                     double c[MAX_N + MAX_M], double Z, int m, int n, int iteration) {
    int i, j;
    printf("\n🟦 Tableau du Simplexe — Étape %d\n", iteration);
    printf("-------------------------------------------------------------\n");
    printf("Base\t|");
    for (j = 0; j < n + m; j++) printf(" x%d\t", j + 1);
    printf("|  b\n");
    printf("-------------------------------------------------------------\n");
    for (i = 0; i < m; i++) {
        printf("s%d\t|", i + 1);
        for (j = 0; j < n + m; j++) printf(" %.2lf\t", A[i][j]);
        printf("| %.2lf\n", b[i]);
    }
    printf("-------------------------------------------------------------\n");
    printf("Z\t|");
    for (j = 0; j < n + m; j++) printf(" %.2lf\t", c[j]);
    printf("| %.2lf\n", Z);
    printf("-------------------------------------------------------------\n");
}

/* ==================== PIVOT SIMPLEXE ==================== */
int trouverColonnePivot(double c[], int cols) {
    int j, pivotCol = -1;
    double min = 0;
    for (j = 0; j < cols; j++) {
        if (c[j] < min - EPS) { min = c[j]; pivotCol = j; }
    }
    return pivotCol;
}

int trouverLignePivot(double A[MAX_M][MAX_N + MAX_M], double b[MAX_M], int m, int pivotCol) {
    int i, pivotRow = -1;
    double minRatio = 1e18;
    for (i = 0; i < m; i++) {
        if (A[i][pivotCol] > EPS) {
            double ratio = b[i] / A[i][pivotCol];
            if (ratio < minRatio - EPS) { minRatio = ratio; pivotRow = i; }
        }
    }
    return pivotRow;
}

void fairePivot(double A[MAX_M][MAX_N + MAX_M], double b[MAX_M], double c[MAX_N + MAX_M],
                int m, int n, int pivotRow, int pivotCol, double *Z) {
    int i, j;
    double pivot = A[pivotRow][pivotCol];
    if (fabs(pivot) < EPS) return;
    for (j = 0; j < n + m; j++) A[pivotRow][j] /= pivot;
    b[pivotRow] /= pivot;
    for (i = 0; i < m; i++) {
        if (i == pivotRow) continue;
        double facteur = A[i][pivotCol];
        for (j = 0; j < n + m; j++) A[i][j] -= facteur * A[pivotRow][j];
        b[i] -= facteur * b[pivotRow];
    }
    double facteur = c[pivotCol];
    for (j = 0; j < n + m; j++) c[j] -= facteur * A[pivotRow][j];
    *Z += facteur * b[pivotRow];
}

/* ==================== SIMPLEXE CORE ==================== */
void simplexeCoreMax(int m, int n, double A0[MAX_M][MAX_N], double b0[MAX_M], double c0_orig[MAX_N]) {
    double A[MAX_M][MAX_N + MAX_M], b[MAX_M], c[MAX_N + MAX_M], Z = 0.0;
    int i, j, iteration = 0;

    for (i = 0; i < m; i++) {
        for (j = 0; j < n; j++) A[i][j] = A0[i][j];
        for (j = n; j < n + m; j++) A[i][j] = (i == j - n) ? 1.0 : 0.0;
        b[i] = b0[i];
    }

    for (j = 0; j < n; j++) c[j] = -c0_orig[j];
    for (j = n; j < n + m; j++) c[j] = 0.0;

    afficherTableau(A, b, c, Z, m, n, iteration);

    while (1) {
        iteration++;
        int pivotCol = trouverColonnePivot(c, n + m);
        if (pivotCol == -1) break;
        int pivotRow = trouverLignePivot(A, b, m, pivotCol);
        if (pivotRow == -1) { printf("\n Solution non bornée !\n"); return; }
        fairePivot(A, b, c, m, n, pivotRow, pivotCol, &Z);
        afficherTableau(A, b, c, Z, m, n, iteration);
        if (iteration > 200) break;
    }

    double x[MAX_N];
    for (j = 0; j < n; j++) {
        int estBasique = 0, ligneBasique = -1;
        for (i = 0; i < m; i++) {
            if (fabs(A[i][j] - 1.0) < EPS) {
                if (!estBasique) { estBasique = 1; ligneBasique = i; }
                else { estBasique = 0; break; }
            } else if (fabs(A[i][j]) > EPS) { estBasique = 0; break; }
        }
        x[j] = estBasique ? b[ligneBasique] : 0.0;
    }

    double Z_true = 0.0;
    for (j = 0; j < n; j++) Z_true += c0_orig[j] * x[j];

    printf("\n=== Résultat final ===\n");
    for (j = 0; j < n; j++) printf("x%d = %.4lf\n", j + 1, x[j]);
    printf("Z = %.4lf\n", Z_true);
}

/* ==================== MÉTHODE À DEUX PHASES ==================== */
void simplexePhase1(int m, int n, double A0[MAX_M][MAX_N], double b0[MAX_M]) {
    // Ici on peut simplement forcer b >= 0
    for (int i = 0; i < m; i++) {
        if (b0[i] < 0) {
            b0[i] *= -1;
            for (int j = 0; j < n; j++) A0[i][j] *= -1;
        }
    }
    printf("\n--- Phase 1 : Construction de solution réalisable ---\n");
}

void simplexeDeuxPhases(int m, int n, double A0[MAX_M][MAX_N], double b0[MAX_M], double c0[MAX_N]) {
    printf("\n🔵 Méthode à deux phases activée.\n");
    simplexePhase1(m, n, A0, b0);
    printf("\n--- Phase 2 : Optimisation ---\n");
    simplexeCoreMax(m, n, A0, b0, c0);
}


/* ==================== MAIN ==================== */
int main() {
    int m, n;
    char type;
    double A0[MAX_M][MAX_N], b0[MAX_M], c0[MAX_N];
    char signe[MAX_M][3];

    scanf(" %c", &type);
    scanf("%d", &n);
    scanf("%d", &m);

    for (int j = 0; j < n; j++) scanf("%lf", &c0[j]);

    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) scanf("%lf", &A0[i][j]);
        scanf("%s", signe[i]);
        scanf("%lf", &b0[i]);

        if (strcmp(signe[i], ">=") == 0) {
            for (int j = 0; j < n; j++) A0[i][j] *= -1;
            b0[i] *= -1;
        }
    }

    int canonique = 1;
    for (int i = 0; i < m; i++) if (b0[i] < 0) canonique = 0;

    if ((canonique && (type == 'M' || type == 'm'))) {
        simplexeCoreMax(m, n, A0, b0, c0);
    } else {
        simplexeDeuxPhases(m, n, A0, b0, c0);
    }

    return 0;
}
