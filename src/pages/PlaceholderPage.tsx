import { ButtonLink } from '../components/common/ButtonLink';
import { PageContainer } from '../components/layout/PageContainer';

interface PlaceholderPageProps {
  description: string;
  eyebrow: string;
  title: string;
}

export function PlaceholderPage({ description, eyebrow, title }: PlaceholderPageProps) {
  return (
    <PageContainer>
      <section className="page-card page-card--centered">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
        <ButtonLink to="/" variant="secondary">
          Back home
        </ButtonLink>
      </section>
    </PageContainer>
  );
}
