#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

#define MAX_M 10
#define MAX_N 10

/* ==================== CONVERSION DU PRIMAL EN DUAL ==================== */
void convertirEnDual(int m, int n, double A[MAX_M][MAX_N],
                     double b[MAX_M], double c[MAX_N],
                     double A_dual[MAX_N][MAX_M],
                     double b_dual[MAX_N],
                     double c_dual[MAX_M],
                     char primalType) {
    int i, j;
    if (primalType == 'M' || primalType == 'm') { // MAX -> Dual MIN
        for (i = 0; i < n; i++) {
            for (j = 0; j < m; j++)
                A_dual[i][j] = A[j][i]; // transposé
            b_dual[i] = c[i];          // c primal devient b dual
        }
        for (j = 0; j < m; j++) c_dual[j] = b[j]; // b primal devient c dual
    } else { // MIN -> Dual MAX
        for (i = 0; i < n; i++) {
            for (j = 0; j < m; j++)
                A_dual[i][j] = A[j][i]; // transposé
            b_dual[i] = c[i];
        }
        for (j = 0; j < m; j++) c_dual[j] = b[j];
    }
}

/* ==================== AFFICHAGE DU DUAL ==================== */
void afficherDual(int dual_m, int dual_n,
                  double A_dual[MAX_N][MAX_M],
                  double b_dual[MAX_N],
                  double c_dual[MAX_M],
                  char dualType) {
    int i, j;
    printf("\n=== Programme dual ===\n");
    printf("Type: %s\n", (dualType == 'M' || dualType == 'm') ? "Minimisation" : "Maximisation");
    printf("\nFonction objectif : ");
    for (i = 0; i < dual_n; i++) {
        printf("%s%.2lf*y%d ", (i > 0 && c_dual[i] >= 0) ? "+" : "", c_dual[i], i+1);
    }
    printf("\n\nContraintes duales :\n");
    for (i = 0; i < dual_m; i++) {
        printf("  ");
        for (j = 0; j < dual_n; j++) {
            printf("%s%.2lf*y%d ", (j > 0 && A_dual[i][j] >= 0) ? "+" : "", A_dual[i][j], j+1);
        }
        printf(">= %.2lf\n", b_dual[i]);
    }
}

/* ==================== MAIN ==================== */
int main() {
    int m, n, canonique = 1;
    char type;
    double A[MAX_M][MAX_N], b[MAX_M], c[MAX_N];
    char signe[MAX_M][3];

    // Lecture SANS prompts (pour compatibilité backend)
    scanf(" %c", &type);
    scanf("%d", &n);
    scanf("%d", &m);

    for (int j = 0; j < n; j++) scanf("%lf", &c[j]);

    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) scanf("%lf", &A[i][j]);
        scanf("%s", signe[i]);
        scanf("%lf", &b[i]);

        if (strcmp(signe[i], ">=") == 0) {
            for (int j = 0; j < n; j++) A[i][j] *= -1;
            b[i] *= -1;
        }
        if (b[i] < 0) canonique = 0;
    }

    // Conversion en dual
    double A_dual[MAX_N][MAX_M], b_dual[MAX_N], c_dual[MAX_M];
    char dualType = (type == 'M' || type == 'm') ? 'N' : 'M';
    convertirEnDual(m, n, A, b, c, A_dual, b_dual, c_dual, type);

    // Affichage du dual
    afficherDual(n, m, A_dual, b_dual, c_dual, dualType);

    printf("\nForme canonique primal : %s\n", canonique ? "Oui" : "Non");

    return 0;
}