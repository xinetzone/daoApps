import { describe, it, expect } from 'vitest'
import { cn } from '../src/cn'

describe('cn', () => {
    it('should merge class names', () => {
        expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('should handle conditional classes', () => {
        expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
    })

    it('should merge tailwind classes correctly', () => {
        expect(cn('px-2', 'px-4')).toBe('px-4')
    })

    it('should handle undefined and null', () => {
        expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
    })

    it('should handle object notation', () => {
        expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz')
    })

    it('should handle array notation', () => {
        expect(cn(['foo', 'bar'])).toBe('foo bar')
    })

    it('should merge conflicting tailwind utilities', () => {
        expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
        expect(cn('bg-white', 'bg-black')).toBe('bg-black')
    })
})
