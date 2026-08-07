export type GameBibleDecisionCoverage = Record<string, string[]>;

const cover = (sectionId: string, ids: string[]): GameBibleDecisionCoverage =>
  Object.fromEntries(ids.map((id) => [id, [sectionId]]));

export const GAME_BIBLE_DECISION_COVERAGE: GameBibleDecisionCoverage = {
  ...cover('identity.overview', [
    'GDR-PROD-001', 'GDR-PROD-002', 'GDR-PROD-003', 'GDR-PROD-004',
  ]),
  ...cover('setting.overview', [
    'GDR-SET-001', 'GDR-SET-002', 'GDR-SET-003', 'GDR-SET-004',
    'GDR-SET-006', 'GDR-PC-004', 'GDR-PC-005',
  ]),
  ...cover('character.overview', ['GDR-PC-006']),
  ...cover('boundaries.see-also', ['GDR-CAMP-001']),
  ...cover('journey.in-play', [
    'GDR-MIS-001', 'GDR-MIS-002', 'GDR-MIS-003', 'GDR-MIS-004', 'GDR-MIS-005',
    'GDR-MIS-006', 'GDR-MIS-007', 'GDR-MIS-008', 'GDR-MIS-009', 'GDR-MIS-010',
  ]),
  ...cover('character.in-play', [
    'GDR-RPG-004', 'GDR-RPG-007', 'GDR-RPG-008', 'GDR-RPG-009', 'GDR-RPG-010',
  ]),
  ...cover('condition.in-play', [
    'GDR-HLT-004', 'GDR-PAR-001', 'GDR-PAR-003', 'GDR-PAR-004',
    'GDR-PAR-005', 'GDR-PAR-006', 'GDR-PAR-007', 'GDR-PAR-008',
  ]),
  ...cover('condition.recovery', ['GDR-FAIL-001', 'GDR-PAR-009']),
  ...cover('time.in-play', [
    'GDR-TIME-001', 'GDR-TIME-002', 'GDR-TIME-003', 'GDR-TIME-004',
  ]),
  ...cover('time.recovery', ['GDR-SAFE-001']),
  ...cover('movement.in-play', [
    'GDR-MOV-001', 'GDR-MOV-002', 'GDR-INT-001', 'GDR-OBS-001', 'GDR-OBS-002',
  ]),
  ...cover('surveillance.in-play', [
    'GDR-SUR-001', 'GDR-SUR-002', 'GDR-SUR-003', 'GDR-SUR-004', 'GDR-SUR-005',
    'GDR-SUR-006', 'GDR-SUR-007', 'GDR-SUR-008',
  ]),
  ...cover('surveillance.system-links', [
    'GDR-SUR-009', 'GDR-SUR-010', 'GDR-CIV-001',
  ]),
  ...cover('stealth.in-play', [
    'GDR-STL-001', 'GDR-STL-002', 'GDR-STL-003', 'GDR-ESC-001', 'GDR-ESC-002',
  ]),
  ...cover('narrative.in-play', ['GDR-DLG-001', 'GDR-DLG-002', 'GDR-DLG-003']),
  ...cover('knowledge.overview', ['GDR-FACT-001', 'GDR-FACT-002']),
  ...cover('narrative.system-links', [
    'GDR-GEO-001', 'GDR-GEO-002', 'GDR-GEO-003', 'GDR-GEO-004',
  ]),
  ...cover('hud.overview', ['GDR-UI-001', 'GDR-UI-002', 'GDR-UI-004', 'GDR-UI-005']),
  ...cover('knowledge.in-play', ['GDR-UI-003', 'GDR-SOC-001']),
  ...cover('art.overview', [
    'GDR-ART-001', 'GDR-ART-003', 'GDR-ART-004', 'GDR-ART-005', 'GDR-ART-006',
    'GDR-ART-011', 'GDR-SUP-001', 'GDR-SUP-003',
  ]),
  ...cover('world.overview', ['GDR-ART-002', 'GDR-SET-007']),
  ...cover('equivalence.in-play', ['GDR-AUD-001', 'GDR-AUD-002']),
};

export const NON_PLAYER_FACING_DECISIONS: Record<string, string> = {
  'GDR-SET-005': 'Leadership details still sitting in the specification review queue are not finalized player canon.',
  'GDR-ART-007': 'Source licensing and version-control boundaries are production governance.',
  'GDR-ART-009': 'Requester-facing visual delivery gates are production process.',
  'GDR-ART-010': 'Reference-art provenance is an internal production constraint.',
  'GDR-SUP-002': 'A superseded-evidence note about earlier building enlargement is internal design history.',
  'GDR-SUP-004': 'Registration of a historical art reference is internal audit data.',
  'GDR-GOV-001': 'Evidence hierarchy is acceptance governance, not game behavior.',
  'GDR-GOV-002': 'Specification precedence is repository governance.',
  'GDR-GOV-003': 'Document and ticket traceability is delivery governance.',
  'GDR-GOV-004': 'Recovery-archive protection is repository governance.',
  'GDR-GOV-005': 'Ticket retirement and blocker hygiene are tracker governance.',
  'GDR-GOV-006': 'Automated-versus-human evidence policy is delivery governance.',
  'GDR-GOV-007': 'The lifecycle of undecided values is internal specification governance.',
  'GDR-GOV-008': 'Canonical authoring and projection ownership is internal documentation governance.',
  'GDR-GOV-009': 'The lineage-references policy is documentation governance; the notes it mandates become player-facing content only when T7A ships them.',
};
