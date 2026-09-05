import React from 'react';
import { cn, generateInitials } from '../../utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fallbackClassName?: string;
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, name, size = 'md', fallbackClassName, ...props }, ref) => {
    const sizes = {
      xs: 'h-6 w-6 text-[10px]',
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
      xl: 'h-16 w-16 text-lg',
    };

    const [imageError, setImageError] = React.useState(false);

    React.useEffect(() => {
      setImageError(false);
    }, [src]);

    const imageSource = React.useMemo(() => {
      if (!src) return undefined;

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const apiOrigin = new URL(apiUrl, window.location.origin).origin;

      if (/^https?:\/\//i.test(src)) {
        try {
          const parsed = new URL(src);
          // If the backend generated an avatar URL using APP_URL without port (e.g. http://localhost/storage/...)
          if ((parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') && parsed.pathname.startsWith('/storage/')) {
            return `${apiOrigin}${parsed.pathname}`;
          }
          return src;
        } catch {
          return src;
        }
      }

      return `${apiOrigin}${src.startsWith('/') ? src : `/${src}`}`;
    }, [src]);


    const handleImageError = () => {
      setImageError(true);
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gray-100',
          sizes[size],
          className
        )}
        {...props}
      >
        {imageSource && !imageError ? (
          <img
            src={imageSource}
            alt={name}
            className="h-full w-full object-cover"
            onError={handleImageError}
          />
        ) : (
          <span
            className={cn(
              'font-medium text-gray-600 select-none',
              fallbackClassName
            )}
          >
            {generateInitials(name)}
          </span>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  avatars: Array<{ src?: string; name: string }>;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, avatars, max = 3, size = 'md', ...props }, ref) => {
    const displayAvatars = avatars.slice(0, max);
    const remaining = avatars.length - max;

    return (
      <div
        ref={ref}
        className={cn('flex -space-x-2', className)}
        {...props}
      >
        {displayAvatars.map((avatar, index) => (
          <Avatar
            key={index}
            src={avatar.src}
            name={avatar.name}
            size={size}
            className="ring-2 ring-surface"
          />
        ))}
        {remaining > 0 && (
          <div
            className={cn(
              'relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gray-200 ring-2 ring-surface',
              size === 'sm' && 'h-8 w-8 text-xs',
              size === 'md' && 'h-10 w-10 text-sm',
              size === 'lg' && 'h-12 w-12 text-base'
            )}
          >
            <span className="font-medium text-gray-600">
              +{remaining}
            </span>
          </div>
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = 'AvatarGroup';