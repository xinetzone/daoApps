import { cn } from '@tao/shared'

export interface Tab {
    value: string
    label: string
}

export interface TabsProps {
    tabs: Tab[]
    value: string
    onChange: (value: string) => void
    className?: string
}

export function Tabs({ tabs, value, onChange, className }: TabsProps) {
    return (
        <div className={cn('inline-flex h-9 items-center rounded-lg bg-muted p-1 text-muted-foreground', className)}>
            {tabs.map((tab) => (
                <button
                    key={tab.value}
                    onClick={() => onChange(tab.value)}
                    className={cn(
                        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all',
                        value === tab.value
                            ? 'bg-background text-foreground shadow-sm'
                            : 'hover:text-foreground',
                    )}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    )
}
