import React, { forwardRef } from 'react';

export interface HUDIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

export const IconBase = forwardRef<SVGSVGElement, HUDIconProps>(
  ({ className, title, children, role, ...rest }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      className={cx('h-4 w-4 shrink-0 text-current', className)}
      role={title ? role ?? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  ),
);

IconBase.displayName = 'IconBase';
