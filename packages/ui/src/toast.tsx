import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@tao/shared'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
    id: string
    type: ToastType
    title: string
    description?: string
    duration?: number
}

interface ToastContextType {
    toasts: Toast[]
    addToast: (toast: Omit<Toast, 'id'>) => void
    removeToast: (id: string) => void
    toast: (message: string, type: ToastType) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).slice(2)
        setToasts((prev) => [...prev, { ...toast, id }])
    }, [])

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    const toast = useCallback((message: string, type: ToastType) => {
        addToast({ title: message, type })
    }, [addToast])

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, toast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    )
}

const iconMap = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
}

const colorMap = {
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    error: 'bg-destructive/15 text-destructive border-destructive/30',
    info: 'bg-primary/15 text-primary border-primary/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    )
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    const Icon = iconMap[toast.type]

    useEffect(() => {
        const timer = setTimeout(onClose, toast.duration || 5000)
        return () => clearTimeout(timer)
    }, [onClose, toast.duration])

    return (
        <div
            className={cn(
                'flex items-start gap-3 rounded-lg border p-4 shadow-lg animate-slide-in',
                'bg-card text-card-foreground',
                colorMap[toast.type]
            )}
        >
            <Icon className="h-5 w-5 shrink-0" />
            <div className="flex-1">
                <p className="font-medium">{toast.title}</p>
                {toast.description && (
                    <p className="text-sm opacity-80 mt-1">{toast.description}</p>
                )}
            </div>
            <button onClick={onClose} className="shrink-0 opacity-70 hover:opacity-100">
                <X className="h-4 w-4" />
            </button>
        </div>
    )
}
