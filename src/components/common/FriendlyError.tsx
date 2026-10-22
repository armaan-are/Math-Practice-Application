import type { ReactNode } from 'react';
import { ButtonLink } from './ButtonLink';
import { PageContainer } from '../layout/PageContainer';

interface FriendlyErrorProps {
  actionLabel?: string;
  actionTo?: string;
  children?: ReactNode;
  eyebrow?: string;
  message: string;
  title: string;
}

export function FriendlyError({
  actionLabel,
  actionTo,
  children,
  eyebrow = 'Let’s get back on track',
  message,
  title,
}: FriendlyErrorProps) {
  return (
    <PageContainer>
      <section
        aria-labelledby="friendly-error-title"
        className="page-card page-card--centered friendly-error"
      >
        <p className="eyebrow">{eyebrow}</p>
        <h1 id="friendly-error-title">{title}</h1>
        <p>{message}</p>
        {children}
        <div className="button-row">
          {actionTo && actionLabel && (
            <ButtonLink to={actionTo}>{actionLabel}</ButtonLink>
          )}
          {actionTo !== '/' && (
            <ButtonLink to="/" variant="secondary">
              Return home
            </ButtonLink>
          )}
        </div>
      </section>
    </PageContainer>
  );
}
