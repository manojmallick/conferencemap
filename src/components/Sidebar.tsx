// src/components/Sidebar.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const NAV = [
  { href: '/', icon: '💬', label: 'Ask' },
  { href: '/sessions', icon: '📅', label: 'Sessions' },
  { href: '/agenda', icon: '🗓️', label: 'Agenda' },
  { href: '/organiser', icon: '📊', label: 'Organiser' },
  { href: '/judges', icon: '⚖️', label: 'For Judges' },
];

const GITHUB_URL = 'https://github.com/manojmallick';
const REPO_URL = 'https://github.com/manojmallick/conferencemap';
const SIGMAP_URL = 'https://github.com/manojmallick/sigmap';

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">◆</span>
        <span className="logo-text">ConferenceMap</span>
        <span className="logo-badge">verified by SigMap</span>
      </div>
      <nav className="sidebar-nav">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={clsx('nav-item', path === n.href && 'nav-item--active')}
          >
            <span className="nav-icon">{n.icon}</span>
            <span className="nav-label">{n.label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-links">
          <a className="sidebar-link" href={SIGMAP_URL} target="_blank" rel="noreferrer">
            <span className="sidebar-link-icon">✶</span> About SigMap
          </a>
          <a className="sidebar-link" href={REPO_URL} target="_blank" rel="noreferrer">
            <span className="sidebar-link-icon">★</span> Source code
          </a>
          <a className="sidebar-link" href={GITHUB_URL} target="_blank" rel="noreferrer">
            <span className="sidebar-link-icon">@</span> manojmallick
          </a>
        </div>
        <span className="footer-tag">JSNation · React Summit</span>
        <span className="footer-tag">Amsterdam 2026</span>
      </div>
    </aside>
  );
}
