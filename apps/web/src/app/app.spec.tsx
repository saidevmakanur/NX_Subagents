import { render } from '@testing-library/react';

import App from './app';

describe('App', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<App />);
    expect(baseElement).toBeTruthy();
  });

  it('should render the task manager heading', () => {
    const { getByRole } = render(<App />);
    expect(getByRole('heading', { name: /task manager/i })).toBeTruthy();
  });
});
