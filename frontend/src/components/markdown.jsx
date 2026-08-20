// Minimal markdown renderer shared by the lesson summary (NotesPanel) and
// chapter summary (ChapterSummaryModal) views. Renders headings, list items,
// and **bold** inline text; ignores code blocks and tables.

function formatInlineStyles(text) {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  if (parts.length > 1) {
    return parts.map((part, i) =>
      i % 2 === 1 ? (
        <strong key={i} style={{ color: 'var(--text-primary)' }}>
          {part}
        </strong>
      ) : (
        part
      )
    );
  }
  return text;
}

export function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    if (line.startsWith('### ')) {
      return <h4 key={idx} style={{ marginTop: '12px', marginBottom: '6px', color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 600 }}>{line.substring(4)}</h4>;
    }
    if (line.startsWith('## ')) {
      return <h3 key={idx} style={{ marginTop: '16px', marginBottom: '8px', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>{line.substring(3)}</h3>;
    }
    if (line.startsWith('# ')) {
      return <h2 key={idx} style={{ marginTop: '18px', marginBottom: '10px', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 600 }}>{line.substring(2)}</h2>;
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const content = line.substring(2);
      return <li key={idx} style={{ marginLeft: '16px', marginBottom: '4px', listStyleType: 'disc', fontSize: '0.85rem', lineHeight: '1.4', color: 'var(--text-secondary)' }}>{formatInlineStyles(content)}</li>;
    }
    if (line.trim() === '') {
      return <div key={idx} style={{ height: '8px' }} />;
    }
    return <p key={idx} style={{ marginBottom: '8px', fontSize: '0.85rem', lineHeight: '1.4', color: 'var(--text-secondary)' }}>{formatInlineStyles(line)}</p>;
  });
}
