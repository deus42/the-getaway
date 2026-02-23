import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as ts from 'typescript';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mainScenePath = path.join(projectRoot, 'src/game/scenes/MainScene.ts');
const modulesDir = path.join(projectRoot, 'src/game/scenes/main/modules');
const maxMainSceneLines = 400;

const failures = [];

const mainSceneSource = fs.readFileSync(mainScenePath, 'utf8');
const mainSceneLineCount = mainSceneSource.split('\n').length;
if (mainSceneLineCount > maxMainSceneLines) {
  failures.push(
    `[MainScene] Expected <= ${maxMainSceneLines} lines, found ${mainSceneLineCount}.`
  );
}

const moduleFiles = fs
  .readdirSync(modulesDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.ts'))
  .map((entry) => path.join(modulesDir, entry.name));

moduleFiles.forEach((filePath) => {
  const source = fs.readFileSync(filePath, 'utf8');
  if (source.includes('as unknown as')) {
    const relativePath = path.relative(projectRoot, filePath);
    failures.push(`[Modules] Forbidden "as unknown as" cast found in ${relativePath}.`);
  }
});

const sourceFile = ts.createSourceFile(
  mainScenePath,
  mainSceneSource,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TS
);

const mainSceneClass = sourceFile.statements.find((statement) => {
  return (
    ts.isClassDeclaration(statement) &&
    statement.name &&
    statement.name.text === 'MainScene'
  );
});

if (!mainSceneClass || !ts.isClassDeclaration(mainSceneClass)) {
  failures.push('[MainScene] Unable to locate MainScene class declaration.');
} else {
  mainSceneClass.members.forEach((member) => {
    if (!ts.isPropertyDeclaration(member) || !member.name) {
      return;
    }

    const flags = ts.getCombinedModifierFlags(member);
    const isPrivate = (flags & ts.ModifierFlags.Private) !== 0;
    const isProtected = (flags & ts.ModifierFlags.Protected) !== 0;
    const isReadonly = (flags & ts.ModifierFlags.Readonly) !== 0;

    if (!isPrivate && !isProtected && !isReadonly) {
      const name = member.name.getText(sourceFile);
      const position = sourceFile.getLineAndCharacterOfPosition(member.name.getStart(sourceFile));
      failures.push(
        `[MainScene] Mutable public property "${name}" at line ${position.line + 1}.`
      );
    }
  });
}

if (failures.length > 0) {
  console.error('[check-scene-architecture] FAILED');
  failures.forEach((failure) => {
    console.error(` - ${failure}`);
  });
  process.exit(1);
}

console.log(
  `[check-scene-architecture] OK (MainScene lines: ${mainSceneLineCount}, modules scanned: ${moduleFiles.length})`
);
