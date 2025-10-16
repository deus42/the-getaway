#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractTriplesFromPrompt } from '../src/game/narrative/tripleExtraction';
import {
  materialiseSceneDefinition,
  type ScenePipelineIssue,
} from '../src/game/world/generation/worldGenerationPipeline';
import {
  validateGeneratedSceneDefinition,
  type GeneratedSceneDefinition,
} from '../src/game/narrative/tripleTypes';

interface CliOptions {
  levelKey?: string;
  missionKey?: string;
  questKeys: string[];
  story?: string;
  inputFile?: string;
  width: number;
  height: number;
  sceneId?: string;
  sceneResourceKey?: string;
  dryRun: boolean;
  verbose: boolean;
}

interface CliResult {
  status: 'success' | 'error';
  message: string;
  outputPath?: string;
  issues?: string[];
}

const DEFAULT_WIDTH = 32;
const DEFAULT_HEIGHT = 24;

const dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(dirname, '..');
const contentRoot = path.join(projectRoot, 'src', 'content');

const parseArgs = (argv: string[]): CliOptions => {
  const options: CliOptions = {
    questKeys: [],
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    dryRun: false,
    verbose: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case '--level':
      case '--level-key': {
        options.levelKey = argv[index + 1];
        index += 1;
        break;
      }
      case '--mission':
      case '--mission-key': {
        options.missionKey = argv[index + 1];
        index += 1;
        break;
      }
      case '--quest': {
        const questKey = argv[index + 1];
        if (questKey) {
          options.questKeys.push(questKey);
        }
        index += 1;
        break;
      }
      case '--story': {
        options.story = argv[index + 1];
        index += 1;
        break;
      }
      case '--input':
      case '--input-file': {
        options.inputFile = argv[index + 1];
        index += 1;
        break;
      }
      case '--width': {
        options.width = Number.parseInt(argv[index + 1] ?? '', 10) || DEFAULT_WIDTH;
        index += 1;
        break;
      }
      case '--height': {
        options.height = Number.parseInt(argv[index + 1] ?? '', 10) || DEFAULT_HEIGHT;
        index += 1;
        break;
      }
      case '--scene-id': {
        options.sceneId = argv[index + 1];
        index += 1;
        break;
      }
      case '--scene-key': {
        options.sceneResourceKey = argv[index + 1];
        index += 1;
        break;
      }
      case '--dry-run': {
        options.dryRun = true;
        break;
      }
      case '--verbose': {
        options.verbose = true;
        break;
      }
      default:
        break;
    }
  }

  return options;
};

const ensureStory = async (options: CliOptions): Promise<string> => {
  if (options.story) {
    return options.story;
  }

  if (options.inputFile) {
    const absolute = path.isAbsolute(options.inputFile)
      ? options.inputFile
      : path.join(process.cwd(), options.inputFile);
    return fs.readFile(absolute, 'utf-8');
  }

  throw new Error('No mission story provided. Use --story "..." or --input ./path/to/file.txt');
};

const deriveIdFromMission = (missionKey: string): { sceneId: string; sceneResourceKey: string } => {
  const missionId = missionKey.includes('.')
    ? missionKey.split('.').slice(1).join('.')
    : missionKey;
  const safeMissionId = missionId.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();

  return {
    sceneId: `scene-${safeMissionId}`,
    sceneResourceKey: `scenes.${safeMissionId}`,
  };
};

const resolveOutputPath = async (
  definition: GeneratedSceneDefinition,
  sceneId: string
): Promise<string> => {
  const levelId = definition.levelKey.includes('.')
    ? definition.levelKey.split('.').slice(1).join('.')
    : definition.levelKey;
  const missionId = definition.missionKey.includes('.')
    ? definition.missionKey.split('.').slice(1).join('.')
    : definition.missionKey;

  const dir = path.join(
    contentRoot,
    'levels',
    levelId,
    'missions',
    missionId,
    'generatedScenes'
  );

  await fs.mkdir(dir, { recursive: true });

  return path.join(dir, `${sceneId}.json`);
};

const assembleSceneDefinition = (
  options: CliOptions,
  story: string
): GeneratedSceneDefinition => {
  if (!options.levelKey || !options.missionKey) {
    throw new Error('Both --level and --mission are required.');
  }

  const { sceneId, sceneResourceKey } = deriveIdFromMission(options.missionKey);

  const extraction = extractTriplesFromPrompt(
    {
      missionKey: options.missionKey,
      levelKey: options.levelKey,
      questKeys: options.questKeys,
      text: story,
    },
    { minimumTriples: 1 }
  );

  if (extraction.issues.length > 0 && options.verbose) {
    extraction.issues.forEach((issue) => {
      // eslint-disable-next-line no-console
      console.warn(`Extraction issue ${issue.path}: ${issue.message}`);
    });
  }

  return {
    id: options.sceneId ?? sceneId,
    resourceKey: options.sceneResourceKey ?? sceneResourceKey,
    levelKey: options.levelKey,
    missionKey: options.missionKey,
    questKeys: options.questKeys,
    width: options.width,
    height: options.height,
    baseTile: 'floor',
    metadata: {
      story,
      usedManualFallback: extraction.usedManualFallback,
    },
    moments: extraction.moments,
    placements: [],
  };
};

const writeSceneFile = async (
  definition: GeneratedSceneDefinition,
  outputPath: string
): Promise<void> => {
  const contents = JSON.stringify(definition, null, 2);
  await fs.writeFile(outputPath, contents, 'utf-8');
};

const run = async (): Promise<CliResult> => {
  try {
    const options = parseArgs(process.argv.slice(2));
    const story = await ensureStory(options);
    const baseDefinition = assembleSceneDefinition(options, story);

    const validation = validateGeneratedSceneDefinition(baseDefinition);

    if (!validation.success) {
      return {
        status: 'error',
        message: 'Generated scene definition failed validation.',
        issues: validation.issues.map((issue) => `${issue.path}: ${issue.message}`),
      };
    }

    const materialised = materialiseSceneDefinition(baseDefinition, {
      defaultDepthScale: baseDefinition.width,
    });

    const formatIssues = (issues: ScenePipelineIssue[] | undefined): string[] =>
      (issues ?? []).map(
        (issue) =>
          `${issue.severity.toUpperCase()}: ${issue.message}${
            issue.entityKey ? ` [${issue.entityKey}]` : ''
          }`
      );

    if (options.dryRun) {
      return {
        status: 'success',
        message: 'Dry run complete. No files were written.',
        issues: formatIssues(
          materialised.metadata?.pipelineIssues as ScenePipelineIssue[]
        ),
      };
    }

    const outputPath = await resolveOutputPath(
      materialised,
      baseDefinition.id
    );

    await writeSceneFile(materialised, outputPath);

    return {
      status: 'success',
      message: `Scene generated at ${outputPath}`,
      outputPath,
      issues: formatIssues(
        materialised.metadata?.pipelineIssues as ScenePipelineIssue[]
      ),
    };
  } catch (error) {
    const err = error as Error;
    return {
      status: 'error',
      message: err.message,
    };
  }
};

run()
  .then((result) => {
    if (result.status === 'error') {
      // eslint-disable-next-line no-console
      console.error(result.message);
      if (result.issues?.length) {
        result.issues.forEach((issue) => {
          // eslint-disable-next-line no-console
          console.error(`  - ${issue}`);
        });
      }
      process.exitCode = 1;
    } else {
      // eslint-disable-next-line no-console
      console.log(result.message);
      if (result.issues?.length) {
        // eslint-disable-next-line no-console
        console.warn('Pipeline issues:');
        result.issues.forEach((issue) => {
          // eslint-disable-next-line no-console
          console.warn(`  - ${issue}`);
        });
      }
    }
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exitCode = 1;
  });
