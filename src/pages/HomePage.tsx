import { ButtonLink } from '../components/common/ButtonLink';
import { PageContainer } from '../components/layout/PageContainer';

export function HomePage() {
  return (
    <PageContainer className="home-page">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__content">
          <p className="eyebrow">Ready, set, solve!</p>
          <h1 id="hero-title">Build big math confidence.</h1>
          <p className="hero__intro">
            Pick your favorite kind of math, flip fun question cards, and watch your
            skills grow with every answer.
          </p>
          <div className="button-row">
            <ButtonLink to="/practice/setup">Start practicing</ButtonLink>
            <ButtonLink to="/statistics" variant="secondary">
              View statistics
            </ButtonLink>
            <ButtonLink to="/settings" variant="soft">
              Settings
            </ButtonLink>
          </div>
        </div>
        <div className="hero__art" aria-hidden="true">
          <div className="math-orbit math-orbit--one">7 × 8</div>
          <div className="math-orbit math-orbit--two">24 ÷ 6</div>
          <div className="math-orbit math-orbit--three">12 + 9</div>
          <div className="hero__mascot">★</div>
        </div>
      </section>
      <section className="feature-strip" aria-label="What you can practice">
        <article>
          <span aria-hidden="true">＋</span>
          <div>
            <h2>Choose your challenge</h2>
            <p>Add, subtract, multiply, divide, or mix them together.</p>
          </div>
        </article>
        <article>
          <span aria-hidden="true">↻</span>
          <div>
            <h2>Learn from mistakes</h2>
            <p>Math Quest remembers tricky facts and helps you practice them.</p>
          </div>
        </article>
        <article>
          <span aria-hidden="true">↗</span>
          <div>
            <h2>See your progress</h2>
            <p>Celebrate what you know and spot your next goal.</p>
          </div>
        </article>
      </section>
    </PageContainer>
  );
}
