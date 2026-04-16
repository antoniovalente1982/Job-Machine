'use client';

export default function CopyLinkButton({ id, className, style, link, text }: { id?: string, className?: string, style?: React.CSSProperties, link?: string, text?: string }) {
  return (
    <button 
      onClick={(e) => {
        e.preventDefault();
        const baseUrl = window.location.origin;
        const finalLink = link || `${baseUrl}/apply/${id}`;
        navigator.clipboard.writeText(finalLink);
        alert('Link copiato negli appunti!');
      }}
      className={className} 
      style={style}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
      </svg>
      <span>{text || 'Copia Link Job'}</span>
    </button>
  );
}
