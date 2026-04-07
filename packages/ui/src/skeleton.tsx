import { cn } from '@tao/shared'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Skeleton({ className, ...props }: SkeletonProps) {
    return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />
}

export function CardSkeleton() {
    return (
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>
        </div>
    )
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
    return (
        <div className="w-full overflow-auto rounded-lg border border-border">
            <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50">
                    <tr>
                        {Array.from({ length: cols }).map((_, i) => (
                            <th key={i} className="h-10 px-4">
                                <Skeleton className="h-4 w-20" />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: rows }).map((_, ri) => (
                        <tr key={ri} className="border-b border-border">
                            {Array.from({ length: cols }).map((_, ci) => (
                                <td key={ci} className="p-4">
                                    <Skeleton className="h-4 w-3/4" />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
