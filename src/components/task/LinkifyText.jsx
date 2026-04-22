/**
 * LinkifyText — renders plain text with any URLs converted to
 * clickable <a> tags that open in a new browser tab.
 *
 * Usage: <LinkifyText text={someString} />
 */

export default function LinkifyText({ text, className }) {
  if (!text) return null;

  // Fresh regex each render to avoid `lastIndex` statefulness bugs
  const URL_REGEX = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi;
  const parts = text.split(URL_REGEX);

  // Rebuild with a second fresh regex for testing each part
  return (
    <span className={className}>
      {parts.map((part, i) => {
        const isUrl = /^(https?:\/\/|www\.)/i.test(part);
        if (isUrl) {
          const href = /^https?:\/\//i.test(part) ? part : `https://${part}`;
          return (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--accent, #6e56cf)',
                textDecoration: 'underline',
                wordBreak: 'break-all',
                cursor: 'pointer',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }
        return part || null;
      })}
    </span>
  );
}
