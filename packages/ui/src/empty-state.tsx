import { cn } from '@tao/shared'
import { Inbox } from 'lucide-react'

export interface EmptyStateProps {
    icon?: React.ReactNode
    title: string
    description?: string
    action?: React.ReactNode
    className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
            <div className="mb-4 text-muted-foreground">
                {icon ?? <Inbox className="h-12 w-12" />}
            </div>
            <h3 className="text-lg font-medium">{title}</h3>
            {description && <p className="mt-1 text-sm text-muted-foreground max-w-md">{description}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    )
}
