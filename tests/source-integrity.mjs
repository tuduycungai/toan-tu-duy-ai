import { createHash } from 'node:crypto';
import { format } from 'prettier';
import ts from 'typescript';

// Compare executable code after normalizing layout, quotes and comments.
// The baseline was taken from the supplied V6.3.0 archive before cleanup.
export async function sourceHash(file, source) {
  if (/\.(?:ts|tsx|mjs|js)$/.test(file)) {
    source = ts.transpileModule(source, {
      fileName: file,
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        removeComments: true,
      },
    }).outputText;
    source = await format(source, { parser: 'babel', singleQuote: true });
  } else if (file.endsWith('.json')) {
    source = JSON.stringify(JSON.parse(source));
  } else if (file.endsWith('.css')) {
    source = await format(source, { parser: 'css' });
  }
  return createHash('sha256').update(source).digest('hex');
}
