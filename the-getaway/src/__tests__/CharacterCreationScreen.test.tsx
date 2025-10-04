import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import CharacterCreationScreen from '../components/ui/CharacterCreationScreen';

describe('CharacterCreationScreen', () => {
  it('allows typing a call sign on step 1', () => {
    const handleComplete = jest.fn();
    const handleCancel = jest.fn();

    const { getByPlaceholderText } = render(
      <CharacterCreationScreen onComplete={handleComplete} onCancel={handleCancel} />
    );

    const input = getByPlaceholderText('Enter your operative name...') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'Raven' } });

    expect(input.value).toBe('Raven');
  });

  it('displays validation error for unsupported characters but keeps input value', () => {
    const handleComplete = jest.fn();
    const handleCancel = jest.fn();

    const { getByPlaceholderText, getByText } = render(
      <CharacterCreationScreen onComplete={handleComplete} onCancel={handleCancel} />
    );

    const input = getByPlaceholderText('Enter your operative name...') as HTMLInputElement;

    fireEvent.change(input, { target: { value: "Nova!" } });

    expect(input.value).toBe('Nova!');
    expect(getByText('Name can only contain letters, numbers, spaces, and hyphens')).toBeInTheDocument();
  });
});
