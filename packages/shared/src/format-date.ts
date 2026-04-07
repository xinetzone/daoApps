import { format, formatDistance, formatRelative, isValid, parseISO } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'

type Locale = 'zh-CN' | 'en-US'

const locales = {
    'zh-CN': zhCN,
    'en-US': enUS,
}

export function formatDate(
    date: string | Date,
    formatStr: string = 'yyyy-MM-dd',
    locale: Locale = 'zh-CN'
): string {
    const d = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(d)) return ''
    return format(d, formatStr, { locale: locales[locale] })
}

export function formatDateTime(
    date: string | Date,
    locale: Locale = 'zh-CN'
): string {
    return formatDate(date, 'yyyy-MM-dd HH:mm:ss', locale)
}

export function formatRelativeTime(
    date: string | Date,
    locale: Locale = 'zh-CN'
): string {
    const d = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(d)) return ''
    return formatDistance(d, new Date(), { addSuffix: true, locale: locales[locale] })
}

export function formatRelativeDay(
    date: string | Date,
    locale: Locale = 'zh-CN'
): string {
    const d = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(d)) return ''
    return formatRelative(d, new Date(), { locale: locales[locale] })
}
