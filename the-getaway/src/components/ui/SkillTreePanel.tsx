import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SKILL_BRANCHES, SkillBranchDefinition, SkillDefinition } from '../../content/skills';
import { RootState, AppDispatch } from '../../store';
import { allocateSkillPointToSkill, refundSkillPointFromSkill } from '../../store/playerSlice';
import { SkillBranchId, SkillId } from '../../game/interfaces/types';
import { describeSkillEffect, getPlayerSkillValue, getSkillPointIncrement, isSkillTagged } from '../../game/systems/skillTree';

const panelStyle: React.CSSProperties = {
  background: 'linear-gradient(190deg, rgba(15, 23, 42, 0.92), rgba(21, 30, 50, 0.85))',
  border: '1px solid rgba(56, 189, 248, 0.18)',
  borderRadius: '12px',
  padding: '1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  minHeight: 0,
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '1rem',
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '0.95rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: '#38bdf8',
};

const tabListStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: '0.4rem',
};

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '0.45rem 0.3rem',
  borderRadius: '8px',
  border: `1px solid ${active ? '#38bdf8' : 'rgba(148, 163, 184, 0.25)'}`,
  background: active ? 'rgba(56, 189, 248, 0.12)' : 'rgba(15, 23, 42, 0.6)',
  color: active ? '#f8fafc' : '#94a3b8',
  fontSize: '0.68rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
});

const branchContentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.65rem',
  minHeight: 0,
  overflowY: 'auto',
  paddingRight: '0.25rem',
};

const skillRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 54px',
  gap: '0.45rem',
  alignItems: 'center',
};

const skillInfoStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.3rem',
};

const skillNameRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const tagBadgeStyle: React.CSSProperties = {
  padding: '0.15rem 0.35rem',
  borderRadius: '999px',
  fontSize: '0.55rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  background: 'rgba(245, 158, 11, 0.18)',
  border: '1px solid rgba(245, 158, 11, 0.45)',
  color: '#f59e0b',
  fontWeight: 600,
};

const stubBadgeStyle: React.CSSProperties = {
  padding: '0.15rem 0.35rem',
  borderRadius: '999px',
  fontSize: '0.55rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  background: 'rgba(148, 163, 184, 0.2)',
  border: '1px solid rgba(148, 163, 184, 0.35)',
  color: '#cbd5e1',
  fontWeight: 600,
};

const skillControlsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.35rem',
};

const controlButtonStyle = (active: boolean): React.CSSProperties => ({
  width: '24px',
  height: '24px',
  borderRadius: '6px',
  border: `1px solid ${active ? '#38bdf8' : 'rgba(148, 163, 184, 0.25)'}`,
  background: active ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.6)',
  color: active ? '#38bdf8' : '#64748b',
  fontSize: '0.85rem',
  fontWeight: 700,
  cursor: active ? 'pointer' : 'not-allowed',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s ease',
});

const skillValueStyle: React.CSSProperties = {
  minWidth: '40px',
  textAlign: 'center',
  fontWeight: 600,
  color: '#f8fafc',
  fontSize: '0.8rem',
};

const effectStyle: React.CSSProperties = {
  fontSize: '0.65rem',
  color: '#94a3b8',
  lineHeight: 1.35,
};

const descriptionStyle: React.CSSProperties = {
  fontSize: '0.62rem',
  color: 'rgba(148, 163, 184, 0.75)',
};

const pointsBadgeStyle: React.CSSProperties = {
  padding: '0.2rem 0.45rem',
  borderRadius: '6px',
  fontSize: '0.65rem',
  background: 'rgba(56, 189, 248, 0.12)',
  border: '1px solid rgba(56, 189, 248, 0.35)',
  color: '#bae6fd',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontWeight: 600,
};

const helpTextStyle: React.CSSProperties = {
  fontSize: '0.6rem',
  color: 'rgba(148, 163, 184, 0.7)',
};

const announcementStyle: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(1px, 1px, 1px, 1px)',
};

const getBranchById = (branchId: SkillBranchId): SkillBranchDefinition => {
  const branch = SKILL_BRANCHES.find((entry) => entry.id === branchId);
  if (!branch) {
    throw new Error(`[SkillTreePanel] Unknown branch id: ${branchId}`);
  }
  return branch;
};

const SkillTreePanel: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const player = useSelector((state: RootState) => state.player.data);
  const availablePoints = player.skillPoints;

  const defaultBranch: SkillBranchId = useMemo(() => {
    if (availablePoints > 0) {
      return 'combat';
    }
    return 'combat';
  }, [availablePoints]);

  const [activeBranch, setActiveBranch] = useState<SkillBranchId>(defaultBranch);
  const [announcement, setAnnouncement] = useState('');
  const tabRefs = useRef<Record<SkillBranchId, HTMLButtonElement | null>>({
    combat: null,
    tech: null,
    survival: null,
    social: null,
  });
  const previousValuesRef = useRef(player.skillTraining);

  useEffect(() => {
    previousValuesRef.current = player.skillTraining;
  }, []);

  useEffect(() => {
    const prev = previousValuesRef.current;
    const current = player.skillTraining;

    if (prev === current) {
      return;
    }

    for (const branch of SKILL_BRANCHES) {
      for (const skill of branch.skills) {
        const before = prev[skill.id];
        const after = current[skill.id];
        if (before !== after) {
          const effectMessage = describeSkillEffect(skill.id, after);
          const delta = (after ?? 0) - (before ?? 0);
          const changeVerb = delta > 0 ? 'increased' : 'decreased';
          setAnnouncement(`${skill.name} ${changeVerb} to ${after}. ${effectMessage}`);
          previousValuesRef.current = current;
          return;
        }
      }
    }

    previousValuesRef.current = current;
  }, [player.skillTraining]);

  useEffect(() => {
    if (availablePoints <= 0 && activeBranch !== defaultBranch) {
      setActiveBranch(defaultBranch);
    }
  }, [availablePoints, activeBranch, defaultBranch]);

  const switchBranch = useCallback((branchId: SkillBranchId) => {
    setActiveBranch(branchId);
    const target = tabRefs.current[branchId];
    if (target) {
      target.focus();
    }
  }, []);

  const handleTabKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, branchId: SkillBranchId) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
        return;
      }

      event.preventDefault();
      const branchOrder: SkillBranchId[] = ['combat', 'tech', 'survival', 'social'];
      const currentIndex = branchOrder.indexOf(branchId);
      if (currentIndex === -1) {
        return;
      }

      const nextIndex = event.key === 'ArrowLeft'
        ? (currentIndex + branchOrder.length - 1) % branchOrder.length
        : (currentIndex + 1) % branchOrder.length;

      switchBranch(branchOrder[nextIndex]);
    },
    [switchBranch]
  );

  const handleAllocate = useCallback(
    (skillId: SkillId) => {
      dispatch(allocateSkillPointToSkill(skillId));
    },
    [dispatch]
  );

  const handleRefund = useCallback(
    (skillId: SkillId) => {
      dispatch(refundSkillPointFromSkill(skillId));
    },
    [dispatch]
  );

  const renderSkillRow = (skill: SkillDefinition) => {
    const currentValue = getPlayerSkillValue(player, skill.id);
    const tagged = isSkillTagged(player, skill.id);
    const increment = getSkillPointIncrement(player, skill.id);
    const canIncrease = availablePoints > 0 && currentValue + increment <= skill.maxValue;
    const canDecrease = currentValue - increment >= 0;
    const effectMessage = describeSkillEffect(skill.id, currentValue);
    const incrementLabel = tagged ? `1 pt → +${increment} (tag)` : `1 pt → +${increment}`;

    return (
      <div key={skill.id} style={skillRowStyle}>
        <div style={skillInfoStyle}>
          <div style={skillNameRowStyle}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc' }}>{skill.name}</span>
            {tagged && <span style={tagBadgeStyle}>Tag Skill</span>}
            {skill.stub && <span style={stubBadgeStyle}>Stub</span>}
          </div>
          <p style={descriptionStyle}>{skill.description}</p>
          <p style={effectStyle}>{effectMessage}</p>
          <p style={{ ...effectStyle, color: 'rgba(148, 163, 184, 0.6)' }}>{incrementLabel}</p>
        </div>
        <div style={skillControlsStyle}>
          <button
            type="button"
            aria-label={`Decrease ${skill.name}`}
            onClick={() => handleRefund(skill.id)}
            disabled={!canDecrease}
            style={controlButtonStyle(canDecrease)}
          >
            −
          </button>
          <span style={skillValueStyle}>{currentValue}</span>
          <button
            type="button"
            aria-label={`Increase ${skill.name}`}
            onClick={() => handleAllocate(skill.id)}
            disabled={!canIncrease}
            style={controlButtonStyle(canIncrease)}
          >
            +
          </button>
        </div>
      </div>
    );
  };

  const activeBranchDefinition = getBranchById(activeBranch);

  return (
    <section style={panelStyle} aria-labelledby="skill-tree-title">
      <div style={headerStyle}>
        <h2 id="skill-tree-title" style={titleStyle}>Skill Trees</h2>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
          <span style={pointsBadgeStyle} aria-live="polite">
            {availablePoints} Skill Points
          </span>
          <span style={helpTextStyle}>Base increment +5 • Tagged increment +10</span>
        </div>
      </div>

      <div role="tablist" aria-label="Skill branches" style={tabListStyle}>
        {SKILL_BRANCHES.map((branch) => {
          const selected = activeBranch === branch.id;
          return (
            <button
              key={branch.id}
              type="button"
              role="tab"
              ref={(node) => {
                tabRefs.current[branch.id] = node;
              }}
              aria-selected={selected}
              aria-controls={`skill-branch-${branch.id}`}
              id={`skill-tab-${branch.id}`}
              onKeyDown={(event) => handleTabKeyDown(event, branch.id)}
              onClick={() => switchBranch(branch.id)}
              style={tabStyle(selected)}
            >
              {branch.label}
            </button>
          );
        })}
      </div>

      <div
        id={`skill-branch-${activeBranchDefinition.id}`}
        role="tabpanel"
        aria-labelledby={`skill-tab-${activeBranchDefinition.id}`}
        style={branchContentStyle}
      >
        <p style={helpTextStyle}>{activeBranchDefinition.blurb}</p>
        {activeBranchDefinition.skills.map(renderSkillRow)}
      </div>

      <div style={helpTextStyle}>
        Spend points with Enter or Space. Arrow keys switch branches. Tagged skills cost one point for +10 instead of +5.
      </div>
      <div aria-live="polite" style={announcementStyle}>{announcement}</div>
    </section>
  );
};

export default SkillTreePanel;
