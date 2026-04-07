import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@tao/shared'

const badgeVariants = cva(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
    {
        variants: {
            variant: {
                default: 'border-border bg-secondary text-secondary-foreground',
                primary: 'border-primary/30 bg-primary/10 text-primary',
                secondary: 'border-transparent bg-secondary text-secondary-foreground',
                destructive: 'border-destructive/30 bg-destructive/10 text-destructive',
                outline: 'border-border text-muted-foreground',
                success: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400',
                warning: 'border-amber-500/30 bg-amber-500/15 text-amber-400',
            },
        },
        defaultVariants: { variant: 'default' },
    },
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

export function Badge({ className, variant, ...props }: BadgeProps) {
    return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { badgeVariants }
