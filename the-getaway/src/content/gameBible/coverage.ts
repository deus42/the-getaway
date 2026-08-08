export interface RequiredGameBibleTopic {
  id: string;
  chapterId: string;
}

const topics = (chapterId: string, ids: string[]): RequiredGameBibleTopic[] =>
  ids.map((id) => ({ id, chapterId }));

export const REQUIRED_GAME_BIBLE_TOPICS: RequiredGameBibleTopic[] = [
  ...topics('identity', [
    'product.fantasy', 'product.identity', 'product.experience', 'product.pillars',
    'product.surveillance-antagonist', 'product.escape-over-combat', 'product.content-boundary',
  ]),
  ...topics('setting', [
    'setting.2036', 'setting.tokyo', 'setting.hidzu', 'setting.cold-iron',
    'setting.expatriate', 'setting.father', 'setting.miami-continuation',
  ]),
  ...topics('journey', [
    'journey.creation', 'journey.safehouse', 'journey.briefing', 'journey.preparation',
    'journey.departure', 'journey.dusk-route', 'journey.curfew-route', 'journey.cache',
    'journey.escape', 'journey.return', 'journey.validation', 'journey.debrief', 'journey.ending',
  ]),
  ...topics('character', [
    'character.cover', 'character.appearance', 'character.abilities', 'character.fragile-hardened',
    'character.gates', 'character.facts', 'character.research', 'character.persistence', 'character.future-covers',
  ]),
  ...topics('condition', [
    'condition.paranoia', 'condition.tiers', 'condition.ability-locks', 'condition.sources',
    'condition.recovery', 'condition.failures', 'condition.capture', 'condition.restart-attempt',
  ]),
  ...topics('movement', [
    'movement.direct', 'movement.collision', 'movement.interaction', 'movement.camera',
    'movement.overview', 'movement.observation', 'movement.no-pathfinding',
  ]),
  ...topics('time', [
    'time.start', 'time.acceleration', 'time.curfew', 'time.deadline', 'time.schedules',
    'time.wait', 'time.rest', 'time.safehouse', 'time.autosave', 'time.attempt-baseline',
  ]),
  ...topics('surveillance', [
    'surveillance.states', 'surveillance.evidence', 'surveillance.coverage',
    'surveillance.occlusion', 'surveillance.last-known', 'surveillance.security',
    'surveillance.civilians', 'surveillance.drone', 'surveillance.terminals',
  ]),
  ...topics('stealth', [
    'stealth.hiding', 'stealth.blending', 'stealth.contexts', 'stealth.recovery-sequence',
    'stealth.interception', 'stealth.noncombat', 'stealth.escape',
  ]),
  ...topics('narrative', [
    'narrative.lira', 'narrative.naila', 'narrative.brant', 'narrative.dialogue',
    'narrative.gates', 'narrative.george', 'narrative.truth', 'narrative.debrief',
  ]),
  ...topics('knowledge', [
    'knowledge.facts', 'knowledge.dossier', 'knowledge.objectives', 'knowledge.minimap',
    'knowledge.terminals', 'knowledge.social-feed', 'knowledge.provenance', 'knowledge.outcome-ledger',
  ]),
  ...topics('hud', [
    'hud.four-lanes', 'hud.cover-paranoia', 'hud.current-beat', 'hud.overlays',
    'hud.bible', 'hud.search', 'hud.focus', 'hud.accessibility',
  ]),
  ...topics('world', [
    'world.four-blocks', 'world.three-identities', 'world.three-loops', 'world.routes',
    'world.entrances', 'world.anchors', 'world.collision', 'world.human-scale',
  ]),
  ...topics('art', [
    'art.surveillance-noir', 'art.neo-tokyo-source', 'art.blender', 'art.geometry-authority',
    'art.actors', 'art.portraits', 'art.lighting', 'art.camera-composition',
  ]),
  ...topics('equivalence', [
    'audio.semantic-cues', 'audio.no-voice', 'localization.en-uk', 'localization.diegetic',
    'accessibility.equivalent-meaning', 'accessibility.non-color', 'performance.world-first',
  ]),
  ...topics('boundaries', [
    'boundary.combat', 'boundary.inventory', 'boundary.authored-content',
    'boundary.continue-exploring', 'boundary.end-demo', 'boundary.miami', 'boundary.no-placeholder',
  ]),
];

export const topicIdsForChapter = (chapterId: string): string[] =>
  REQUIRED_GAME_BIBLE_TOPICS.filter((topic) => topic.chapterId === chapterId)
    .map((topic) => topic.id);
