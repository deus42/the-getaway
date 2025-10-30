import React from 'react';
import { IconBase, HUDIconProps } from './IconBase';

const SystemIcon: React.FC<HUDIconProps> = ({ className, ...rest }) => (
  <IconBase className={className} {...rest}>
    <circle
      cx={12}
      cy={12}
      r={3.6}
      fill="currentColor"
      fillOpacity={0.14}
    />
    <circle
      cx={12}
      cy={12}
      r={2.6}
      stroke="currentColor"
      strokeWidth={1.8}
      fill="none"
    />
    <path
      d="M12 6V4m0 16v-2M6 12H4m16 0h-2M8 8 6.5 6.5m11 11-1.5-1.5M8 16l-1.5 1.5m13-13L17 8"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      fill="none"
    />
  </IconBase>
);

export default SystemIcon;
