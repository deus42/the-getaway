import packageJson from "../package.json";

const versionPattern = /^(\d{4})\.(\d+)\.(\d+)$/;

const versionMatch = typeof packageJson.version === "string"
  ? packageJson.version.match(versionPattern)
  : null;

const fallbackYear = new Date().getFullYear();

export const GAME_VERSION = packageJson.version ?? "0.0.0";
export const GAME_YEAR = versionMatch ? Number(versionMatch[1]) : fallbackYear;
