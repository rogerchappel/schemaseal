import { DEFAULT_CONFIG_PATH } from './config.js';
import { checkFiles } from './check.js';
import { writeOutput } from './io.js';
import { pinSchema } from './pin.js';
import { renderJson, renderMarkdown } from './render.js';

interface Args { _: string[]; [key: string]: string | boolean | string[]; }

function parseArgs(argv: string[]): Args {
  const args: Args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) args._.push(token);
    else {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) args[key] = true;
      else { args[key] = next; i += 1; }
    }
  }
  return args;
}

export function help(): string {
  return `SchemaSeal seals schema expectations for local files.\n\nUsage:\n  schemaseal pin <schema> --name <name> [--config .schemaseal/pins.json]\n  schemaseal check <files...> --schema <schema> [--format markdown|json] [--report out.md] [--fail-on error|warning|never]\n  schemaseal check <files...> --name <pin> [--format markdown|json]\n\nDefaults: --redact on, --format markdown, --fail-on error, --config ${DEFAULT_CONFIG_PATH}.\n`;
}

export async function run(argv: string[] = process.argv.slice(2)): Promise<number> {
  const args = parseArgs(argv);
  const command = args._[0];
  if (!command || command === 'help' || args.help) { process.stdout.write(help()); return 0; }
  const configPath = String(args.config ?? DEFAULT_CONFIG_PATH);
  const redact = args.redact !== 'false' && args['no-redact'] !== true;
  if (command === 'pin') {
    const schemaPath = args._[1];
    if (!schemaPath) throw new Error('pin requires a schema path');
    const name = String(args.name ?? schemaPath);
    const pin = await pinSchema(schemaPath, { name, configPath, redact });
    process.stdout.write(`Pinned ${pin.name} ${pin.schemaHash} -> ${configPath}\n`);
    return 0;
  }
  if (command === 'check') {
    const files = args._.slice(1);
    if (files.length === 0) throw new Error('check requires at least one file');
    const report = await checkFiles(files, { schemaPath: args.schema ? String(args.schema) : undefined, schemaName: args.name ? String(args.name) : undefined, configPath, redact });
    const format = String(args.format ?? 'markdown');
    const text = format === 'json' ? renderJson(report) : renderMarkdown(report);
    await writeOutput(args.report ? String(args.report) : '-', text);
    const failOn = String(args['fail-on'] ?? 'error');
    if (failOn === 'never') return 0;
    if (failOn === 'warning' && report.summary.findings > 0) return 1;
    if (failOn === 'error' && report.summary.errors > 0) return 1;
    return 0;
  }
  throw new Error(`Unknown command: ${command}`);
}
