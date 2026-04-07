import { forwardRef } from 'react'
import { cn } from '@tao/shared'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    error?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, error, children, ...props }, ref) => (
        <div className="w-full">
            <select
                className={cn(
                    'flex h-9 w-full items-center rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50',
                    error && 'border-destructive focus-visible:ring-destructive/50',
                    className,
                )}
                ref={ref}
                {...props}
            >
                {children}
            </select>
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
    ),
)
Select.displayName = 'Select'

export { Select }
