import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'danger';
  full?: boolean;
  children: ReactNode;
}

export function Button({ variant = 'primary', full, className = '', children, ...rest }: Props) {
  const classes = [
    'btn',
    variant === 'outline' ? 'btn--outline' : '',
    variant === 'danger' ? 'btn--danger' : '',
    full ? 'btn--full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
