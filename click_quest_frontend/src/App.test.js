import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app and Start Screen', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /click quest/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument();
});
