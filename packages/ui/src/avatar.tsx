import { forwardRef } from 'react'
import { cn } from '@tao/shared'

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
    src?: string
    alt?: string
    fallback?: string
    name?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-20 w-20 text-2xl',
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
    ({ className, src, alt, fallback, name, size = 'md', ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                'relative flex shrink-0 overflow-hidden rounded-full',
                sizeClasses[size],
                className
            )}
            {...props}
        >
            {src ? (
                <img
                    src={src}
                    alt={alt || 'Avatar'}
                    className="aspect-square h-full w-full object-cover"
                />
            ) : (
                <span className="flex h-full w-full items-center justify-center bg-muted font-medium">
                    {fallback || name?.charAt(0).toUpperCase() || alt?.charAt(0).toUpperCase() || 'U'}
                </span>
            )}
        </div>
    )
)
Avatar.displayName = 'Avatar'

export { Avatar }
