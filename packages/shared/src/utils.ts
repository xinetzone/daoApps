export const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
}

export const getReputationLevel = (reputation: number): { title: string; color: string } => {
    if (reputation >= 10000) return { title: '传奇', color: 'text-reputation' }
    if (reputation >= 5000) return { title: '大师', color: 'text-primary' }
    if (reputation >= 2000) return { title: '专家', color: 'text-success' }
    if (reputation >= 500) return { title: '达人', color: 'text-foreground' }
    if (reputation >= 100) return { title: '活跃', color: 'text-muted-foreground' }
    return { title: '新手', color: 'text-muted-foreground' }
}
