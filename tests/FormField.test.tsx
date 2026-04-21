import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import FormField from '@/components/ui/form-field';

describe('FormField', () => {
  it('renders the label and fires onChangeText', () => {
    const onChangeText = jest.fn();
    const { getByText, getByLabelText } = render(
      <FormField label="Name" value="" onChangeText={onChangeText} placeholder="Your name" />
    );

    expect(getByText('Name')).toBeTruthy();
    expect(getByLabelText('Name').props.placeholder).toBe('Your name');

    fireEvent.changeText(getByLabelText('Name'), 'Alice');
    expect(onChangeText).toHaveBeenCalledWith('Alice');
  });

  it('shows an error message when provided', () => {
    const { getByText } = render(
      <FormField
        label="Email"
        value=""
        onChangeText={jest.fn()}
        error="Please enter a valid email"
      />
    );

    expect(getByText('Please enter a valid email')).toBeTruthy();
  });
});
