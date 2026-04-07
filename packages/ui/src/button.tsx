import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@tao/shared'

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground hover:bg-primary/90',
                destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
                outline: 'border border-border bg-transparent hover:bg-accent hover:text-accent-foreground',
                secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                ghost: 'hover:bg-accent hover:text-accent-foreground',
                link: 'text-primary underline-offset-4 hover:underline',
                success: 'bg-success text-success-foreground hover:bg-success/90',
                premium: 'gradient-primary text-primary-foreground glow hover:opacity-90',
                mood: 'bg-gradient-primary text-primary-foreground shadow-mood hover:shadow-glow hover:brightness-105',
                glass: 'glass-card text-foreground hover:shadow-glow hover:border-primary/30',
                soft: 'bg-primary/10 text-primary hover:bg-primary/20',
                warm: 'bg-gradient-to-r from-orange-500 to-rose-500 text-white hover:from-orange-600 hover:to-rose-600',
                purple: 'bg-purple-600 text-white hover:bg-purple-700',
                emerald: 'bg-emerald-600 text-white hover:bg-emerald-700',
                amber: 'bg-amber-500 text-white hover:bg-amber-600',
                gradient: 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:opacity-90',
                primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
                fire: 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600',
                capsule: 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700',
            },
            size: {
                default: 'h-9 px-4 py-2',
                sm: 'h-8 rounded-md px-3 text-xs',
                lg: 'h-10 rounded-md px-8',
                xl: 'h-12 rounded-lg px-10 text-base',
                icon: 'h-9 w-9',
                'icon-sm': 'h-8 w-8 rounded-md',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, loading, children, disabled, ...props }, ref) => (
        <button
            className={cn(buttonVariants({ variant, size, className }))}
            ref={ref}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            )}
            {children}
        </button>
    ),
)
Button.displayName = 'Button'

export { Button, buttonVariants }
