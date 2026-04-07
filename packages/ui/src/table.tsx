import { cn } from '@tao/shared'

export interface Column<T> {
    key: string
    header: string
    className?: string
    render: (row: T) => React.ReactNode
}

export interface TableProps<T> {
    columns: Column<T>[]
    data: T[]
    keyExtractor: (row: T) => string
    onRowClick?: (row: T) => void
    emptyMessage?: string
    className?: string
    loading?: boolean
}

export function Table<T>({
    columns,
    data,
    keyExtractor,
    onRowClick,
    emptyMessage = '暂无数据',
    className,
    loading,
}: TableProps<T>) {
    return (
        <div className={cn('w-full overflow-auto rounded-lg border border-border', className)}>
            <table className="w-full caption-bottom text-sm">
                <thead className="border-b border-border bg-muted/50">
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className={cn('h-10 px-4 text-left align-middle font-medium text-muted-foreground', col.className)}
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i} className="border-b border-border">
                                {columns.map((col) => (
                                    <td key={col.key} className="p-4">
                                        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        data.map((row) => (
                            <tr
                                key={keyExtractor(row)}
                                className={cn(
                                    'border-b border-border transition-colors hover:bg-muted/50',
                                    onRowClick && 'cursor-pointer',
                                )}
                                onClick={() => onRowClick?.(row)}
                            >
                                {columns.map((col) => (
                                    <td key={col.key} className={cn('p-4 align-middle', col.className)}>
                                        {col.render(row)}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    )
}
