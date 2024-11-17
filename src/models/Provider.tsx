import { PullRequest } from './PullRequest';
export abstract class Provider {
    protected token: string; // Token de autenticación del proveedor
    protected name: string; // Nombre del proveedor

    constructor(name: string, token: string) {
        this.name = name;
        this.token = token;
    }

    // Método para sincronizar los Pull Requests
    abstract syncPullRequests(): Promise<PullRequest[]>;

    // Método para validar las credenciales
    abstract validateCredentials(): Promise<boolean>;

    // Método para obtener el nombre del proveedor
    getName(): string {
        return this.name;
    }

    // Método para actualizar el token
    setToken(newToken: string): void {
        this.token = newToken;
    }
}