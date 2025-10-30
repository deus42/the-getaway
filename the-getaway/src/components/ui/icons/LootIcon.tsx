import React from 'react';
import { IconBase, HUDIconProps } from './IconBase';

const LootIcon: React.FC<HUDIconProps> = ({ className, ...rest }) => (
  <IconBase className={className} {...rest}>
    <path
      d="M4.5 8.8h15l-2 8.5h-11z"
      fill="currentColor"
      fillOpacity={0.16}
    />
    <path
      d="M4.5 8.8h15l-2 8.5h-11z"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="m6.6 8.8-1.1-3.6h13l-1.1 3.6"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M10.2 12.2h3.6"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      fill="none"
    />
  </IconBase>
);

export default LootIcon;
