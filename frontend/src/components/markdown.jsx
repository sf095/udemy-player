/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react';
import { Copy, Check, Clock } from 'lucide-react';

// Parse timestamp string (HH:MM:SS, MM:SS, or SS) to seconds
export function parseTimestampToSeconds(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return NaN;
  const parts = timeStr.trim().split(':');
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10);
    const secs = parseInt(parts[1], 10);
    if (!isNaN(mins) && !isNaN(secs)) return mins * 60 + secs;
  } else if (parts.length === 3) {
    const hours = parseInt(parts[0], 10);
    const mins = parseInt(parts[1], 10);
    const secs = parseInt(parts[2], 10);
    if (!isNaN(hours) && !isNaN(mins) && !isNaN(secs)) return hours * 3600 + mins * 60 + secs;
  }
  return NaN;
}

// Code block with syntax styling and a copy-to-clipboard button
function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.warn('Failed to copy code:', err);
    });
  };

  return (
    <div className="chat-code-block">
      <div className="chat-code-header">
        <span>{language || 'code'}</span>
        <button type="button" onClick={handleCopy} className="chat-code-copy-btn" title="Copy code">
          {copied ? <Check size={12} style={{ color: 'var(--accent-green)' }} /> : <Copy size={12} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre style={{ margin: 0, padding: '10px', overflowX: 'auto', fontSize: '0.8rem', lineHeight: '1.45', fontFamily: 'monospace' }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

// Helper to escape regex special characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Highlight matches within plain text
function highlightMatches(text, searchQuery, matchTracker) {
  if (!text || !searchQuery || !searchQuery.trim()) return text;
  const trimmed = searchQuery.trim();
  const regex = new RegExp(`(${escapeRegExp(trimmed)})`, 'gi');
  const parts = text.split(regex);
  if (parts.length <= 1) return text;

  return parts.map((part, i) => {
    if (part.toLowerCase() === trimmed.toLowerCase()) {
      const idx = matchTracker ? matchTracker.count++ : 0;
      const isCurrent = matchTracker ? idx === matchTracker.activeIndex : false;
      return (
        <mark
          key={`match-${idx}-${i}`}
          id={`summary-match-${idx}`}
          className={`summary-search-match ${isCurrent ? 'summary-search-match-active' : ''}`}
        >
          {part}
        </mark>
      );
    }
    return part;
  });
}

// Format inline text: **bold**, `inline code`, and [MM:SS] clickable timestamps
export function formatInlineStyles(text, onSeek = null, highlightOptions = null) {
  if (!text) return null;

  // Split on bold, inline code, and bracketed timestamps
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`|\[\d{1,2}:\d{2}(?::\d{2})?\])/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, i) => {
    if (!part) return null;

    // Bold text: **content**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const boldContent = part.slice(2, -2);
      return (
        <strong key={i} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          {highlightOptions
            ? highlightMatches(boldContent, highlightOptions.searchQuery, highlightOptions.matchTracker)
            : boldContent}
        </strong>
      );
    }

    // Inline code: `content`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const codeContent = part.slice(1, -1);
      return (
        <code
          key={i}
          style={{
            background: 'var(--bg-hover-active)',
            padding: '2px 5px',
            borderRadius: '4px',
            fontSize: '0.82em',
            fontFamily: 'monospace',
            color: 'var(--accent-blue, #38bdf8)'
          }}
        >
          {highlightOptions
            ? highlightMatches(codeContent, highlightOptions.searchQuery, highlightOptions.matchTracker)
            : codeContent}
        </code>
      );
    }

    // Timestamp badge: [MM:SS] or [HH:MM:SS]
    if (part.startsWith('[') && part.endsWith(']')) {
      const timeStr = part.slice(1, -1);
      const seconds = parseTimestampToSeconds(timeStr);
      if (!isNaN(seconds)) {
        if (typeof onSeek === 'function') {
          return (
            <button
              key={i}
              type="button"
              className="chat-timestamp-badge"
              onClick={() => onSeek(seconds)}
              title={`Jump video to ${timeStr}`}
            >
              <Clock size={11} />
              <span>{timeStr}</span>
            </button>
          );
        }
        return <span key={i} style={{ color: 'var(--primary)', fontWeight: 600 }}>[{timeStr}]</span>;
      }
    }

    return highlightOptions
      ? highlightMatches(part, highlightOptions.searchQuery, highlightOptions.matchTracker)
      : part;
  });
}

// Minimal markdown renderer shared by lesson summary and chapter summary views
export function renderMarkdown(text, options = {}) {
  if (!text) return null;
  const { searchQuery = '', activeMatchIndex = 0 } = options;
  const highlightOptions = searchQuery && searchQuery.trim()
    ? { searchQuery: searchQuery.trim(), matchTracker: { count: 0, activeIndex: activeMatchIndex } }
    : null;

  const lines = text.split('\n');
  return lines.map((line, idx) => {
    if (line.startsWith('### ')) {
      return (
        <h4 key={idx} style={{ marginTop: '12px', marginBottom: '6px', color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 600 }}>
          {formatInlineStyles(line.substring(4), null, highlightOptions)}
        </h4>
      );
    }
    if (line.startsWith('## ')) {
      return (
        <h3 key={idx} style={{ marginTop: '16px', marginBottom: '8px', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>
          {formatInlineStyles(line.substring(3), null, highlightOptions)}
        </h3>
      );
    }
    if (line.startsWith('# ')) {
      return (
        <h2 key={idx} style={{ marginTop: '18px', marginBottom: '10px', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 600 }}>
          {formatInlineStyles(line.substring(2), null, highlightOptions)}
        </h2>
      );
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const content = line.substring(2);
      return (
        <li key={idx} style={{ marginLeft: '16px', marginBottom: '4px', listStyleType: 'disc', fontSize: '0.85rem', lineHeight: '1.4', color: 'var(--text-secondary)' }}>
          {formatInlineStyles(content, null, highlightOptions)}
        </li>
      );
    }
    if (line.trim() === '') {
      return <div key={idx} style={{ height: '8px' }} />;
    }
    return (
      <p key={idx} style={{ marginBottom: '8px', fontSize: '0.85rem', lineHeight: '1.4', color: 'var(--text-secondary)' }}>
        {formatInlineStyles(line, null, highlightOptions)}
      </p>
    );
  });
}

// Rich chat message renderer with code blocks and interactive timestamp seeking
export function renderChatMessage(text, { onSeek } = {}) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBuffer = [];
  let codeLang = '';

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];

    // Check code fence
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        // Entering code block
        inCodeBlock = true;
        codeLang = line.trim().slice(3).trim();
        codeBuffer = [];
      } else {
        // Exiting code block
        elements.push(
          <CodeBlock
            key={`code-${idx}`}
            code={codeBuffer.join('\n')}
            language={codeLang}
          />
        );
        inCodeBlock = false;
        codeBuffer = [];
        codeLang = '';
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Markdown headers
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={idx} style={{ marginTop: '10px', marginBottom: '4px', color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 600 }}>
          {formatInlineStyles(line.substring(4), onSeek)}
        </h4>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={idx} style={{ marginTop: '12px', marginBottom: '6px', color: 'var(--text-primary)', fontSize: '0.98rem', fontWeight: 600 }}>
          {formatInlineStyles(line.substring(3), onSeek)}
        </h3>
      );
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={idx} style={{ marginTop: '14px', marginBottom: '8px', color: 'var(--text-primary)', fontSize: '1.08rem', fontWeight: 600 }}>
          {formatInlineStyles(line.substring(2), onSeek)}
        </h2>
      );
      continue;
    }

    // Bullet items
    if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <li key={idx} style={{ marginLeft: '16px', marginBottom: '3px', listStyleType: 'disc', fontSize: '0.825rem', lineHeight: '1.45', color: 'inherit' }}>
          {formatInlineStyles(line.substring(2), onSeek)}
        </li>
      );
      continue;
    }

    // Numbered list items
    const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      elements.push(
        <div key={idx} style={{ marginLeft: '4px', marginBottom: '3px', fontSize: '0.825rem', lineHeight: '1.45', color: 'inherit', display: 'flex', gap: '6px' }}>
          <span style={{ fontWeight: 600, opacity: 0.8 }}>{numMatch[1]}.</span>
          <span style={{ flex: 1 }}>{formatInlineStyles(numMatch[2], onSeek)}</span>
        </div>
      );
      continue;
    }

    // Empty lines
    if (line.trim() === '') {
      elements.push(<div key={idx} style={{ height: '6px' }} />);
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={idx} style={{ marginBottom: '6px', fontSize: '0.825rem', lineHeight: '1.45', color: 'inherit' }}>
        {formatInlineStyles(line, onSeek)}
      </p>
    );
  }

  // Handle unclosed code block if response truncated
  if (inCodeBlock && codeBuffer.length > 0) {
    elements.push(
      <CodeBlock
        key="code-unclosed"
        code={codeBuffer.join('\n')}
        language={codeLang}
      />
    );
  }

  return <div className="chat-rendered-content">{elements}</div>;
}
