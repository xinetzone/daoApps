import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@tao/shared'

export interface DialogProps {
    open: boolean
    onClose: () => void
    title: string
    description?: string
    children: React.ReactNode
    className?: string
}

export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
    const overlayRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [open, onClose])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                ref={overlayRef}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />
            <div
                className={cn(
                    'relative z-50 w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-lg animate-scale-in',
                    className,
                )}
            >
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-semibold">{title}</h2>
                        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    )
}
