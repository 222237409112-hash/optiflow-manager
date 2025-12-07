
#include <stdio.h>
#include <stdlib.h>

#define MAX 50
#define INF 999999

int n;                        // nombre de tâches
int duree[MAX];               // durée de chaque tâche
int graph[MAX][MAX];          // arcs (poids)
int dtt[MAX];                 // dates au plus tôt
int dtp[MAX];                 // dates au plus tard

//-----------------------------------------------------
void afficher_graphe() {
    printf("\n===== GRAPHE (Matrice d'adjacence) =====\n");
    printf("    ");
    for(int i = 0; i < n; i++)
        printf("T%d  ", i);
    printf("\n");

    for(int i = 0; i < n; i++) {
        printf("T%d  ", i);
        for(int j = 0; j < n; j++) {
            if(graph[i][j] == -1)
                printf(".   ");
            else
                printf("%d   ", graph[i][j]);
        }
        printf("\n");
    }

    printf("\n===== LISTE DES ARCS =====\n");
    for(int i = 0; i < n; i++) {
        for(int j = 0; j < n; j++) {
            if(graph[i][j] != -1)
                printf("T%d ---> T%d   (poids = %d)\n", i, j, graph[i][j]);
        }
    }
}

//-----------------------------------------------------
void calcul_DTT() {
    for(int i = 0; i < n; i++)
        dtt[i] = 0;

    for(int i = 0; i < n; i++) {
        for(int j = 0; j < n; j++) {
            if(graph[j][i] != -1) {
                int val = dtt[j] + graph[j][i];
                if(val > dtt[i])
                    dtt[i] = val;
            }
        }
    }
}

//-----------------------------------------------------
void calcul_DTP() {
    int fin_projet = 0;

    for(int i = 0; i < n; i++)
        if(dtt[i] + duree[i] > fin_projet)
            fin_projet = dtt[i] + duree[i];

    for(int i = 0; i < n; i++)
        dtp[i] = fin_projet - duree[i];

    for(int i = n-1; i >= 0; i--) {
        for(int j = 0; j < n; j++) {
            if(graph[i][j] != -1) {
                int val = dtp[j] - graph[i][j];
                if(val < dtp[i])
                    dtp[i] = val;
            }
        }
    }
}

//-----------------------------------------------------
int main() {
    printf("===== METHODE MPM AVEC AFFICHAGE GRAPHE =====\n\n");

    printf("Entrer le nombre de taches : ");
    scanf("%d", &n);

    printf("\nEntrer la duree de chaque tache :\n");
    for(int i = 0; i < n; i++) {
        printf("Duree T%d = ", i);
        scanf("%d", &duree[i]);
    }

    // Init du graphe
    for(int i = 0; i < n; i++)
        for(int j = 0; j < n; j++)
            graph[i][j] = -1;

    printf("\nEntrer les arcs d(i,j), -1 si pas de lien :\n");
    for(int i = 0; i < n; i++) {
        for(int j = 0; j < n; j++) {
            if(i != j) {
                printf("d(%d -> %d) = ", i, j);
                scanf("%d", &graph[i][j]);
            }
        }
    }

    // Affichage du graphe
    afficher_graphe();

    // Calculs
    calcul_DTT();
    calcul_DTP();

    printf("\n===== RESULTATS =====\n");
    for(int i = 0; i < n; i++) {
        int MTT = dtp[i] - dtt[i];
        printf("\nTache T%d :\n", i);
        printf(" - Date au plus tot  (DTT) = %d\n", dtt[i]);
        printf(" - Date au plus tard (DTP) = %d\n", dtp[i]);
        printf(" - Marge totale (MTT) = %d\n", MTT);
        if(MTT == 0)
            printf(" ➤ TACHE CRITIQUE\n");
    }

    // Affichage chemin critique
    printf("\n===== CHEMIN CRITIQUE =====\n");
    for(int i = 0; i < n; i++) {
        if(dtp[i] - dtt[i] == 0)
            printf("T%d ", i);
    }
    printf("\n");

    return 0;
}
