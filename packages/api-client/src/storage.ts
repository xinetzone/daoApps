import type { TokenStorage } from './client'

const STORAGE_KEY = 'tao-auth'

interface AuthState {
    accessToken?: string
    refreshToken?: string
}

export class LocalStorageTokenStorage implements TokenStorage {
    private key: string

    constructor(key: string = STORAGE_KEY) {
        this.key = key
    }

    private getState(): AuthState {
        try {
            const raw = localStorage.getItem(this.key)
            if (!raw) return {}
            return JSON.parse(raw) as AuthState
        } catch {
            return {}
        }
    }

    private setState(state: AuthState): void {
        try {
            localStorage.setItem(this.key, JSON.stringify(state))
        } catch { /* ignore */ }
    }

    getAccessToken(): string | null {
        return this.getState().accessToken ?? null
    }

    getRefreshToken(): string | null {
        return this.getState().refreshToken ?? null
    }

    setAccessToken(token: string): void {
        const state = this.getState()
        state.accessToken = token
        this.setState(state)
    }

    setRefreshToken(token: string): void {
        const state = this.getState()
        state.refreshToken = token
        this.setState(state)
    }

    clear(): void {
        localStorage.removeItem(this.key)
    }
}
