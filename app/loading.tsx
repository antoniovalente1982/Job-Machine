import styles from './dashboard.module.css';

export default function DashboardLoading() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar skeleton */}
      <div style={{ width: 260, borderRight: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', padding: '1.5rem 0' }}>
        <div style={{ padding: '0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--bg-hover)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ width: 100, height: 16, borderRadius: 6, background: 'var(--bg-hover)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ margin: '0.25rem 1.5rem', height: 36, borderRadius: 8, background: i === 1 ? 'var(--accent-light)' : 'transparent' }} />
        ))}
      </div>

      {/* Content skeleton */}
      <div style={{ flex: 1, padding: '2rem 2.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ width: 180, height: 24, borderRadius: 8, background: 'var(--bg-hover)', marginBottom: '0.5rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ width: 300, height: 14, borderRadius: 6, background: 'var(--bg-hover)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>

        {/* KPI skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', gap: '0.85rem' }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--bg-hover)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div>
                <div style={{ width: 50, height: 24, borderRadius: 6, background: 'var(--bg-hover)', marginBottom: '0.3rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div style={{ width: 80, height: 12, borderRadius: 4, background: 'var(--bg-hover)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
