const SECRET_PATTERNS: Array<[RegExp, string]> = [
  [/\b[A-Za-z0-9_]*?(api[_-]?key|token|secret|password|passwd|private[_-]?key)[A-Za-z0-9_]*?\b\s*[:=]\s*(["']?)[^"'\s,}]+\2/gi, '$1=<redacted>'],
  [/\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g, '<redacted:github-token>'],
  [/\bsk-[A-Za-z0-9]{20,}\b/g, '<redacted:api-key>'],
  [/-----BEGIN [^-]+PRIVATE KEY-----[\s\S]*?-----END [^-]+PRIVATE KEY-----/g, '<redacted:private-key>']
];

export function redactText(text: string): string {
  let output = text;
  for (const [pattern, replacement] of SECRET_PATTERNS) output = output.replace(pattern, replacement);
  return output;
}

export function redactValue<T>(value: T): T {
  if (typeof value === 'string') return redactText(value) as T;
  if (Array.isArray(value)) return value.map((item) => redactValue(item)) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (/api[_-]?key|token|secret|password|passwd|private[_-]?key/i.test(key)) out[key] = '<redacted>';
      else out[key] = redactValue(item);
    }
    return out as T;
  }
  return value;
}
