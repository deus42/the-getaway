import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import FloatingNumber from './FloatingNumber';
import HitFlash from './HitFlash';
import { removeFloatingNumber } from '../../store/combatFeedbackSlice';

const CombatFeedbackManager: React.FC = () => {
  const dispatch = useDispatch();
  const { floatingNumbers, activeFlashId, hitFlashes } = useSelector(
    (state: RootState) => state.combatFeedback
  );

  const activeFlash = hitFlashes.find((flash) => flash.id === activeFlashId);

  return (
    <>
      {/* Hit Flash Effect */}
      {activeFlash && (
        <HitFlash
          active={true}
          type={activeFlash.type}
          intensity={activeFlash.intensity}
          duration={activeFlash.duration}
        />
      )}

      {/* Floating Damage Numbers */}
      {floatingNumbers.map((number) => (
        <FloatingNumber
          key={number.id}
          value={number.value}
          x={number.x}
          y={number.y}
          type={number.type}
          onComplete={() => dispatch(removeFloatingNumber(number.id))}
        />
      ))}
    </>
  );
};

export default CombatFeedbackManager;
