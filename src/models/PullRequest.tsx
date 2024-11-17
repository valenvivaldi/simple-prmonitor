export class PullRequest {
    id: string; // ID único del PR
    platform: string;
    prNumber: number; // Número del PR
    title: string; // Título del PR
    repository: string; // Nombre del repositorio
    checksStatus: string; // Estado de los checks (e.g., "Checks Pass", "Checks Fail")
    mergeable: boolean; // Si es mergeable o no
    reviewStatus: string; // Estado de la revisión (e.g., "Waiting for review", "Reviewed", etc.)
    changes: {
        additions: number; // Número de líneas añadidas
        deletions: number; // Número de líneas eliminadas
        commits: number; // Número de commits asociados
    };
    author: {
        name: string; // Nombre del autor
        avatarUrl: string; // URL de la foto del autor
    };
    link: string; // Enlace al PR
    status: {
        checks: string;
        mergeable: boolean;
        review:string;
    }

    constructor(
        id: string,
        platform: string,
        prNumber: number,
        title: string,
        repository: string,
        status: {
            checks: string;
            mergeable: boolean;
            review:string;
        },
        checksStatus: string,
        mergeable: boolean,
        reviewStatus: string,
        changes: { additions: number; deletions: number; commits: number },
        author: { name: string; avatarUrl: string },
        link: string
    ) {
        this.id = id;
        this.platform = platform;
        this.prNumber = prNumber;
        this.title = title;
        this.repository = repository;
        this.status = status;
        this.checksStatus = checksStatus;
        this.mergeable = mergeable;
        this.reviewStatus = reviewStatus;
        this.changes = changes;
        this.author = author;
        this.link = link;
    }
}