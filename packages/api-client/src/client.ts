export class ApiError extends Error {
    constructor(
        public status: number,
        message: string,
        public details?: unknown,
    ) {
        super(message)
        this.name = 'ApiError'
    }
}

export interface TokenStorage {
    getAccessToken(): string | null
    getRefreshToken(): string | null
    setAccessToken(token: string): void
    setRefreshToken(token: string): void
    clear(): void
}

export interface ApiClientConfig {
    baseURL: string
    refreshEndpoint?: string
    onAuthFailure?: () => void
    tokenStorage: TokenStorage
}

let refreshPromise: Promise<string> | null = null

export class ApiClient {
    private baseURL: string
    private refreshEndpoint: string
    private onAuthFailure?: () => void
    private tokenStorage: TokenStorage

    constructor(config: ApiClientConfig) {
        this.baseURL = config.baseURL.replace(/\/+$/, '')
        this.refreshEndpoint = config.refreshEndpoint ?? '/api/v1/auth/refresh'
        this.onAuthFailure = config.onAuthFailure
        this.tokenStorage = config.tokenStorage
    }

    private async refreshAccessToken(): Promise<string> {
        if (refreshPromise) return refreshPromise

        refreshPromise = (async () => {
            try {
                const refresh = this.tokenStorage.getRefreshToken()
                if (!refresh) throw new ApiError(401, '无 Refresh Token')

                const res = await fetch(`${this.baseURL}${this.refreshEndpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh_token: refresh }),
                })

                if (!res.ok) throw new ApiError(401, '刷新令牌失败')

                const data = await res.json() as { access_token: string; refresh_token: string }
                this.tokenStorage.setAccessToken(data.access_token)
                this.tokenStorage.setRefreshToken(data.refresh_token)

                return data.access_token
            } finally {
                refreshPromise = null
            }
        })()

        return refreshPromise
    }

    private async request<T>(method: string, path: string, body?: unknown, retry = true): Promise<T> {
        const access = this.tokenStorage.getAccessToken()
        const headers: Record<string, string> = {}

        if (access) headers['Authorization'] = `Bearer ${access}`
        if (body !== undefined) headers['Content-Type'] = 'application/json'

        const res = await fetch(`${this.baseURL}${path}`, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        })

        if (res.status === 401 && retry) {
            try {
                const newToken = await this.refreshAccessToken()
                headers['Authorization'] = `Bearer ${newToken}`
                const retryRes = await fetch(`${this.baseURL}${path}`, {
                    method,
                    headers,
                    body: body !== undefined ? JSON.stringify(body) : undefined,
                })
                if (!retryRes.ok) {
                    const errData = await retryRes.json().catch(() => ({})) as { detail?: string }
                    throw new ApiError(retryRes.status, errData.detail ?? retryRes.statusText)
                }
                if (retryRes.status === 204) return undefined as T
                return retryRes.json() as Promise<T>
            } catch (e) {
                if (e instanceof ApiError && e.status === 401) {
                    this.tokenStorage.clear()
                    this.onAuthFailure?.()
                }
                throw e
            }
        }

        if (!res.ok) {
            const errData = await res.json().catch(() => ({})) as { detail?: string }
            throw new ApiError(res.status, errData.detail ?? res.statusText)
        }

        if (res.status === 204) return undefined as T
        return res.json() as Promise<T>
    }

    async get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
        let url = path
        if (params) {
            const searchParams = new URLSearchParams()
            for (const [key, value] of Object.entries(params)) {
                if (value !== undefined) searchParams.set(key, String(value))
            }
            const qs = searchParams.toString()
            if (qs) url += `?${qs}`
        }
        return this.request<T>('GET', url)
    }

    async post<T>(path: string, body?: unknown): Promise<T> {
        return this.request<T>('POST', path, body)
    }

    async put<T>(path: string, body?: unknown): Promise<T> {
        return this.request<T>('PUT', path, body)
    }

    async patch<T>(path: string, body?: unknown): Promise<T> {
        return this.request<T>('PATCH', path, body)
    }

    async delete(path: string): Promise<void> {
        return this.request<void>('DELETE', path)
    }

    async postForm<T>(path: string, data: Record<string, string>): Promise<T> {
        const body = new URLSearchParams(data)
        const res = await fetch(`${this.baseURL}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body,
        })
        if (!res.ok) {
            const errData = await res.json().catch(() => ({})) as { detail?: string }
            throw new ApiError(res.status, errData.detail ?? res.statusText)
        }
        return res.json() as Promise<T>
    }
}
