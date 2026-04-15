'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import styles from './Sidebar.module.css';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Kanban, 
  FileText, 
  Settings, 
  LogOut,
  UserCircle
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, section: 'principale' },
  { label: 'Clienti', href: '/clients', icon: Building2, section: 'principale' },
  { label: 'Pipeline', href: '/pipeline', icon: Kanban, section: 'operativo' },
  { label: 'Candidati', href: '/candidates', icon: Users, section: 'operativo' },
  { label: 'Template Messaggi', href: '/templates', icon: FileText, section: 'strumenti' },
  { label: 'Impostazioni', href: '/settings', icon: Settings, section: 'strumenti' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const sections = [
    { key: 'principale', label: 'Principale' },
    { key: 'operativo', label: 'Operativo' },
    { key: 'strumenti', label: 'Strumenti' },
  ];

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || '??';

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarLogo}>
        <div className={styles.logoIcon}>JM</div>
        <div className={styles.logoText}>
          <span className={styles.logoTextAccent}>Job</span> Machine
        </div>
      </div>

      {sections.map(section => {
        const items = navItems.filter(i => i.section === section.key);
        if (items.length === 0) return null;
        return (
          <div key={section.key} className={styles.navSection}>
            <div className={styles.navLabel}>{section.label}</div>
            {items.map(item => {
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}>
                  <div className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}>
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        );
      })}

      <div className={styles.sidebarFooter}>
        <div className={styles.userAvatar}>{initials}</div>
        <div className={styles.userInfo}>
          <div className={styles.userName}>{user?.full_name || user?.email}</div>
          <div className={styles.userRole}>Admin</div>
        </div>
        <button className={styles.logoutBtn} onClick={logout} title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
