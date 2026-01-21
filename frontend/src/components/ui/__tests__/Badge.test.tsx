import { render, screen } from '@testing-library/react';
import { Badge, getTournamentStatusVariant, getMatchStatusVariant } from '../Badge';

describe('Badge', () => {
  it('should render badge with children', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('should apply default variant', () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText('Default');
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-700');
  });

  it('should apply success variant', () => {
    render(<Badge variant="success">Success</Badge>);
    const badge = screen.getByText('Success');
    expect(badge).toHaveClass('bg-green-100', 'text-green-700');
  });

  it('should apply warning variant', () => {
    render(<Badge variant="warning">Warning</Badge>);
    const badge = screen.getByText('Warning');
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-700');
  });

  it('should apply error variant', () => {
    render(<Badge variant="error">Error</Badge>);
    const badge = screen.getByText('Error');
    expect(badge).toHaveClass('bg-red-100', 'text-red-700');
  });

  it('should apply info variant', () => {
    render(<Badge variant="info">Info</Badge>);
    const badge = screen.getByText('Info');
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-700');
  });

  it('should apply custom className', () => {
    render(<Badge className="custom-class">Custom</Badge>);
    const badge = screen.getByText('Custom');
    expect(badge).toHaveClass('custom-class');
  });
});

describe('getTournamentStatusVariant', () => {
  it('should return default for CREATED', () => {
    expect(getTournamentStatusVariant('CREATED')).toBe('default');
  });

  it('should return info for IN_PROGRESS', () => {
    expect(getTournamentStatusVariant('IN_PROGRESS')).toBe('info');
  });

  it('should return warning for PHASE_1_COMPLETE', () => {
    expect(getTournamentStatusVariant('PHASE_1_COMPLETE')).toBe('warning');
  });

  it('should return warning for PHASE_2_COMPLETE', () => {
    expect(getTournamentStatusVariant('PHASE_2_COMPLETE')).toBe('warning');
  });

  it('should return success for FINISHED', () => {
    expect(getTournamentStatusVariant('FINISHED')).toBe('success');
  });

  it('should return default for unknown status', () => {
    expect(getTournamentStatusVariant('UNKNOWN')).toBe('default');
  });
});

describe('getMatchStatusVariant', () => {
  it('should return default for SCHEDULED', () => {
    expect(getMatchStatusVariant('SCHEDULED')).toBe('default');
  });

  it('should return info for IN_PROGRESS', () => {
    expect(getMatchStatusVariant('IN_PROGRESS')).toBe('info');
  });

  it('should return success for COMPLETED', () => {
    expect(getMatchStatusVariant('COMPLETED')).toBe('success');
  });

  it('should return error for CANCELLED', () => {
    expect(getMatchStatusVariant('CANCELLED')).toBe('error');
  });

  it('should return default for unknown status', () => {
    expect(getMatchStatusVariant('UNKNOWN')).toBe('default');
  });
});
