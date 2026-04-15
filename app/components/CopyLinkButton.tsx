'use client';

export default function CopyLinkButton({ id, className, style }: { id: string, className: string, style?: React.CSSProperties }) {
  return (
    <button 
      onClick={(e) => {
        e.preventDefault();
        const baseUrl = window.location.origin;
        navigator.clipboard.writeText(`${baseUrl}/apply/${id}`);
        alert('Link Candidatura pubblico copiato! Incollalo su LinkedIn o Indeed.');
      }}
      className={className} 
      style={style}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
      </svg>
      <span>Copia Link Job</span>
    </button>
  );
}
