import { Link } from 'react-router-dom';
import { Navigation } from './Navigation';

export function Header() {
  return (
    <header className="site-header">
      <div className="header__inner">
        <Link className="brand" to="/" aria-label="Math Quest home">
          <span className="brand__mark" aria-hidden="true">
            MQ
          </span>
          <span>Math Quest</span>
        </Link>
        <Navigation />
      </div>
    </header>
  );
}
