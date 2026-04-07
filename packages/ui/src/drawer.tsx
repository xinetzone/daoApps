import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@tao/shared'

export interface DrawerProps {
    open: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
    className?: string
}

export function Drawer({ open, onClose, title, children, className }: DrawerProps) {
    const drawerRef = useRef<HTMLDivElement>(null)

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
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
            <div
                ref={drawerRef}
                className={cn(
                    'relative z-50 h-full w-full max-w-md border-l border-border bg-card shadow-lg animate-slide-in-right overflow-y-auto',
                    className,
                )}
            >
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card p-4">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="p-4">{children}</div>
            </div>
        </div>
    )
}
