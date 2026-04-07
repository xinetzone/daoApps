import { forwardRef } from 'react'
import { cn } from '@tao/shared'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, error, ...props }, ref) => (
        <div className="w-full">
            <input
                className={cn(
                    'flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50',
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
Input.displayName = 'Input'

export { Input }
