import { forwardRef } from 'react'
import { cn } from '@tao/shared'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, error, ...props }, ref) => (
        <div className="w-full">
            <textarea
                className={cn(
                    'flex min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50',
                    error && 'border-destructive focus-visible:ring-destructive/50',
                    className,
                )}
                ref={ref}
                {...props}
            />
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
    ),
)
Textarea.displayName = 'Textarea'

export { Textarea }
