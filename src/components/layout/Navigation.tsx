import { NavLink } from 'react-router-dom';

const links = [
  { label: 'Practice', to: '/practice/setup' },
  { label: 'Progress', to: '/statistics' },
  { label: 'Settings', to: '/settings' },
];

export function Navigation() {
  return (
    <nav className="navigation" aria-label="Main navigation">
      {links.map((link) => (
        <NavLink
          className={({ isActive }) =>
            `navigation__link${isActive ? ' navigation__link--active' : ''}`
          }
          key={link.to}
          to={link.to}
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
