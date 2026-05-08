import { stableStringify } from './crypto.js';
import type { CheckReport } from './types.js';

export function renderJson(report: CheckReport): string {
  return stableStringify(report);
}

export function renderMarkdown(report: CheckReport): string {
  const lines: string[] = [];
  lines.push('# SchemaSeal Report', '');
  lines.push(`- Tool: ${report.tool}@${report.version}`);
  lines.push(`- Generated: ${report.generatedAt}`);
  lines.push(`- Schema: ${report.schema.name} (${report.schema.path})`);
  lines.push(`- Schema hash: \`${report.schema.hash}\``, '');
  lines.push('## Summary', '');
  lines.push(`- Checked: ${report.summary.checked}`);
  lines.push(`- Passed: ${report.summary.passed}`);
  lines.push(`- Failed: ${report.summary.failed}`);
  lines.push(`- Findings: ${report.summary.findings} (${report.summary.errors} errors, ${report.summary.warnings} warnings)`, '');
  lines.push('## Files', '');
  for (const file of report.files) {
    lines.push(`### ${file.ok ? '✅' : '❌'} ${file.file}`, '');
    lines.push(`- Hash: \`${file.hash}\``);
    lines.push(`- Bytes: ${file.bytes}`);
    if (file.findings.length === 0) lines.push('- Findings: none');
    for (const finding of file.findings) lines.push(`- **${finding.severity.toUpperCase()} ${finding.code}** at \`${finding.path}\`: ${finding.message}`);
    lines.push('');
  }
  lines.push('## Schema Drift', '');
  if (report.drift.length === 0) lines.push('- No pinned schemas found in config.');
  for (const entry of report.drift) lines.push(`- ${entry.status === 'same' ? '✅' : '⚠️'} ${entry.pinName}: ${entry.status} (${entry.schemaPath})`);
  lines.push('');
  return lines.join('\n');
}
