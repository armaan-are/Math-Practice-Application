import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface ButtonLinkProps {
  children: ReactNode;
  to: string;
  variant?: 'primary' | 'secondary' | 'soft';
}

export function ButtonLink({ children, to, variant = 'primary' }: ButtonLinkProps) {
  return (
    <Link className={`button button--${variant}`} to={to}>
      {children}
    </Link>
  );
}
