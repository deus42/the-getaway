import React from 'react';
import { IconBase, HUDIconProps } from './IconBase';

const CombatIcon: React.FC<HUDIconProps> = ({ className, ...rest }) => (
  <IconBase className={className} {...rest}>
    <g
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <path d="M5 4.5 10.2 9.7" />
      <path d="m13.2 6.8 6.3-6.3" />
      <path d="m14 11 5.5 5.5" />
      <path d="M4 15.2 8.8 20" />
      <path d="m4.8 18.4-2.3 2.3" />
      <path d="m15.6 3.8 4.4-2.1-2.1 4.4" />
    </g>
    <path
      d="M10.8 10.8 6.4 15.2c-.5.5-.5 1.3 0 1.8l2 2c.5.5 1.3.5 1.8 0l4.4-4.4z"
      fill="currentColor"
      fillOpacity={0.2}
    />
  </IconBase>
);

export default CombatIcon;
