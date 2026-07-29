import { render, screen } from '@testing-library/react';

import { WarningIcon } from '../components/ui/icons';

describe('IconBase', () => {
  it('has an intrinsic compact size when utility CSS is unavailable', () => {
    render(<WarningIcon data-testid="warning-icon" />);

    expect(screen.getByTestId('warning-icon')).toHaveAttribute('width', '16');
    expect(screen.getByTestId('warning-icon')).toHaveAttribute('height', '16');
  });
});
