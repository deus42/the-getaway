import React from 'react';
import { IconBase, HUDIconProps } from './IconBase';

const DialogueIcon: React.FC<HUDIconProps> = ({ className, ...rest }) => (
  <IconBase className={className} {...rest}>
    <path
      d="M4.5 5.5c0-1.1.9-2 2-2h11c1.1 0 2 .9 2 2v5c0 1.1-.9 2-2 2H12l-4.5 3v-3H6.5c-1.1 0-2-.9-2-2z"
      fill="currentColor"
      fillOpacity={0.18}
    />
    <path
      d="M4.5 5.5c0-1.1.9-2 2-2h11c1.1 0 2 .9 2 2v5c0 1.1-.9 2-2 2H12l-4.5 3v-3H6.5c-1.1 0-2-.9-2-2z"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinejoin="round"
      fill="none"
    />
    <g fill="currentColor">
      <circle cx={9} cy={8.5} r={0.9} />
      <circle cx={12} cy={8.5} r={0.9} />
      <circle cx={15} cy={8.5} r={0.9} />
    </g>
  </IconBase>
);

export default DialogueIcon;
