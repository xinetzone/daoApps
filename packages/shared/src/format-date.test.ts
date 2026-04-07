import { describe, it, expect } from 'vitest'
import { formatDate, formatDateTime, formatRelativeTime } from '../src/format-date'

describe('formatDate', () => {
    it('should format date string', () => {
        const result = formatDate('2024-01-15T10:30:00Z', 'yyyy-MM-dd')
        expect(result).toBe('2024-01-15')
    })

    it('should format Date object', () => {
        const date = new Date('2024-06-20T14:00:00')
        const result = formatDate(date, 'yyyy-MM-dd')
        expect(result).toMatch(/^2024-06-20/)
    })

    it('should return empty string for invalid date', () => {
        expect(formatDate('invalid')).toBe('')
    })

    it('should use default format', () => {
        const result = formatDate('2024-01-15')
        expect(result).toBe('2024-01-15')
    })
})

describe('formatDateTime', () => {
    it('should format date and time', () => {
        const result = formatDateTime('2024-01-15T10:30:00Z')
        expect(result).toContain('2024')
        expect(result).toContain('01')
        expect(result).toContain('15')
    })
})

describe('formatRelativeTime', () => {
    it('should return relative time string', () => {
        const now = new Date()
        const past = new Date(now.getTime() - 60000).toISOString()
        const result = formatRelativeTime(past)
        expect(result).toBeTruthy()
    })
})
