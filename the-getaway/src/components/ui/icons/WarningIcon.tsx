import React from 'react';
import { IconBase, HUDIconProps } from './IconBase';

const WarningIcon: React.FC<HUDIconProps> = ({ className, ...rest }) => (
  <IconBase className={className} {...rest}>
    <path
      d="M12 4.8 4 18.4c-.4.7.1 1.6.9 1.6h14.2c.8 0 1.3-.9.9-1.6L12 4.8z"
      fill="currentColor"
      fillOpacity={0.2}
    />
    <path
      d="M12 4.8 4 18.4c-.4.7.1 1.6.9 1.6h14.2c.8 0 1.3-.9.9-1.6L12 4.8z"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M12 9.8v3.8"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      fill="none"
    />
    <circle cx={12} cy={16.6} r={1} fill="currentColor" />
  </IconBase>
);

export default WarningIcon;
