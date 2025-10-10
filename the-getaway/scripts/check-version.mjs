import { readFile } from "node:fs/promises";

const packageJsonUrl = new URL("../package.json", import.meta.url);
const packageJsonRaw = await readFile(packageJsonUrl, "utf8");
const packageJson = JSON.parse(packageJsonRaw);

const { version } = packageJson;

if (typeof version !== "string") {
  console.error("package.json is missing a semantic version string.");
  process.exit(1);
}

const semverPattern = /^(\d{4})\.(\d+)\.(\d+)$/;
const match = version.match(semverPattern);

if (!match) {
  console.error(
    `Version \"${version}\" must follow the format <year>.<minor>.<patch> (e.g. 2025.1.0).`,
  );
  process.exit(1);
}

const [, majorYear, minor, patch] = match;

for (const [label, part] of [
  ["minor", minor],
  ["patch", patch],
]) {
  const numericPart = Number(part);

  if (!Number.isInteger(numericPart) || numericPart < 0) {
    console.error(`Version ${label} component \"${part}\" must be a non-negative integer.`);
    process.exit(1);
  }
}

const currentYear = new Date().getFullYear();

if (Number(majorYear) !== currentYear) {
  console.error(
    `Version year ${majorYear} does not match the current year ${currentYear}.`,
  );
  process.exit(1);
}

process.stdout.write(`${version}`);
