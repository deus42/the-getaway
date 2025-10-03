import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SKILL_BRANCHES, SkillBranchDefinition, SkillDefinition } from '../../content/skills';
import { RootState, AppDispatch } from '../../store';
import { allocateSkillPointToSkill, refundSkillPointFromSkill } from '../../store/playerSlice';
import { SkillBranchId, SkillId } from '../../game/interfaces/types';
import { describeSkillEffect, getPlayerSkillValue, getSkillPointIncrement, isSkillTagged } from '../../game/systems/skillTree';
import NotificationBadge from './NotificationBadge';
import { gradientTextStyle } from './theme';

const panelStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  borderRadius: '14px',
  padding: '0.6rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.45rem',
  minHeight: 0,
  height: '100%',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '1rem',
  flexShrink: 0,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '0.75rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  ...gradientTextStyle('#bfdbfe', '#38bdf8'),
  filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.4))',
};

const tabListStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: '0.3rem',
  flexShrink: 0,
  isolation: 'isolate',
};

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '0.4rem 0.3rem',
  borderRadius: '6px',
  border: `1px solid ${active ? '#38bdf8' : 'rgba(148, 163, 184, 0.25)'}`,
  background: active ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.6)',
  color: active ? '#f8fafc' : '#94a3b8',
  fontSize: '0.62rem',
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  outline: 'none',
  userSelect: 'none',
  WebkitTapHighlightColor: 'transparent',
  minHeight: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  zIndex: 1000,
});

const branchContentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
  minHeight: 0,
  flex: 1,
  overflowY: 'hidden',
  paddingRight: '0.3rem',
  position: 'relative',
  zIndex: 0,
};

const skillRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  gap: '0.4rem',
  alignItems: 'center',
};

const skillInfoStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.1rem',
};

const skillNameRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const tagBadgeStyle: React.CSSProperties = {
  padding: '0.1rem 0.3rem',
  borderRadius: '999px',
  fontSize: '0.5rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  background: 'rgba(245, 158, 11, 0.18)',
  border: '1px solid rgba(245, 158, 11, 0.45)',
  color: '#f59e0b',
  fontWeight: 600,
};

const stubBadgeStyle: React.CSSProperties = {
  padding: '0.1rem 0.3rem',
  borderRadius: '999px',
  fontSize: '0.5rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  background: 'rgba(148, 163, 184, 0.2)',
  border: '1px solid rgba(148, 163, 184, 0.35)',
  color: '#cbd5e1',
  fontWeight: 600,
};

const skillControlsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.4rem',
};

const skillValueStyle: React.CSSProperties = {
  minWidth: '38px',
  textAlign: 'center',
  fontWeight: 700,
  color: '#f8fafc',
  fontSize: '0.8rem',
};

const effectStyle: React.CSSProperties = {
  fontSize: '0.55rem',
  color: '#94a3b8',
  lineHeight: 1.25,
};

const descriptionStyle: React.CSSProperties = {
  fontSize: '0.53rem',
  color: 'rgba(148, 163, 184, 0.75)',
  lineHeight: 1.25,
};

const helpTextStyle: React.CSSProperties = {
  fontSize: '0.53rem',
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
  const [hoveredButton, setHoveredButton] = React.useState<string | null>(null);

  const defaultBranch: SkillBranchId = useMemo(() => {
    const branchTotals = SKILL_BRANCHES.map((branch) => {
      const total = branch.skills.reduce((acc, skill) => acc + (player.skillTraining[skill.id] ?? 0), 0);
      return { id: branch.id, total };
    });
    branchTotals.sort((a, b) => b.total - a.total);
    return branchTotals[0]?.id ?? 'combat';
  }, [player.skillTraining]);

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
  }, [player.skillTraining]);

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

  const switchBranch = useCallback((branchId: SkillBranchId) => {
    console.log('[SkillTreePanel] Switching to branch:', branchId);
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
    const decreaseKey = `${skill.id}-decrease`;
    const increaseKey = `${skill.id}-increase`;

    const getButtonStyle = (active: boolean, buttonKey: string): React.CSSProperties => {
      const isHovered = hoveredButton === buttonKey;
      return {
        width: '24px',
        height: '24px',
        borderRadius: '5px',
        border: `1px solid ${active ? (isHovered ? '#60a5fa' : '#38bdf8') : 'rgba(148, 163, 184, 0.3)'}`,
        background: active
          ? (isHovered ? 'rgba(56, 189, 248, 0.3)' : 'rgba(56, 189, 248, 0.2)')
          : 'rgba(15, 23, 42, 0.6)',
        color: active ? '#bae6fd' : '#64748b',
        fontSize: '0.9rem',
        fontWeight: 700,
        cursor: active ? 'pointer' : 'not-allowed',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s ease',
        boxShadow: active
          ? (isHovered ? '0 0 16px rgba(56, 189, 248, 0.5)' : '0 2px 8px rgba(56, 189, 248, 0.3)')
          : 'none',
        transform: active && isHovered ? 'scale(1.1)' : 'scale(1)',
      };
    };

    return (
      <div key={skill.id} style={skillRowStyle}>
        <div style={skillInfoStyle}>
          <div style={skillNameRowStyle}>
            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#f8fafc' }}>{skill.name}</span>
            {tagged && <span style={tagBadgeStyle}>Tag</span>}
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
            onMouseEnter={() => canDecrease && setHoveredButton(decreaseKey)}
            onMouseLeave={() => setHoveredButton(null)}
            disabled={!canDecrease}
            style={getButtonStyle(canDecrease, decreaseKey)}
          >
            −
          </button>
          <span style={skillValueStyle}>{currentValue}</span>
          <button
            type="button"
            aria-label={`Increase ${skill.name}`}
            onClick={() => handleAllocate(skill.id)}
            onMouseEnter={() => canIncrease && setHoveredButton(increaseKey)}
            onMouseLeave={() => setHoveredButton(null)}
            disabled={!canIncrease}
            style={getButtonStyle(canIncrease, increaseKey)}
          >
            +
          </button>
        </div>
      </div>
    );
  };

  const activeBranchDefinition = getBranchById(activeBranch);

  console.log('[SkillTreePanel] Render - Active branch:', activeBranch, 'Branch:', activeBranchDefinition.label);

  return (
    <section style={panelStyle} aria-labelledby="skill-tree-title">
      <div style={headerStyle}>
        <h2 id="skill-tree-title" style={titleStyle}>Skill Trees</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={helpTextStyle}>+5 base • +10 tagged</span>
          <div style={skillControlsStyle}>
            <NotificationBadge count={availablePoints} color="#38bdf8" size={22} pulse={availablePoints > 0} />
            <span style={{ ...helpTextStyle, fontSize: '0.6rem' }} aria-live="polite">
              {`${availablePoints} Skill Points`}
            </span>
          </div>
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
              data-branch-id={branch.id}
              data-testid={`skill-tab-${branch.id}`}
              ref={(node) => {
                tabRefs.current[branch.id] = node;
              }}
              aria-selected={selected}
              aria-controls={`skill-branch-${branch.id}`}
              id={`skill-tab-${branch.id}`}
              tabIndex={0}
              onKeyDown={(event) => handleTabKeyDown(event, branch.id)}
              onClick={() => {
                console.log('[SkillTreePanel] Tab clicked:', branch.id, branch.label);
                switchBranch(branch.id);
              }}
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
        <p style={{ ...helpTextStyle, marginBottom: '0.2rem' }}>{activeBranchDefinition.blurb}</p>
        {activeBranchDefinition.skills.map(renderSkillRow)}
      </div>

      <div aria-live="polite" style={announcementStyle}>{announcement}</div>
    </section>
  );
};

export default SkillTreePanel;
