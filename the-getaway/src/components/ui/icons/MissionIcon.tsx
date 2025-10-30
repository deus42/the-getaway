import React from 'react';
import { IconBase, HUDIconProps } from './IconBase';

const MissionIcon: React.FC<HUDIconProps> = ({ className, ...rest }) => (
  <IconBase className={className} {...rest}>
    <path
      d="M5.5 5.5h13v13h-13z"
      fill="currentColor"
      fillOpacity={0.16}
    />
    <path
      d="M5.5 5.5h13v13h-13z"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M8.2 9.2h7.6"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M8.2 12h5.2"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="m8.8 16.1 2.2 2.2 4.6-4.6"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </IconBase>
);

export default MissionIcon;
