
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';

// Simple Mock for Router since LandingPage uses useNavigate
const MockLandingPage = () => (
    <MemoryRouter>
        <LandingPage />
    </MemoryRouter>
);

describe('SkillConnect App Smoke Tests', () => {
  it('renders landing page with main call-to-action', () => {
    render(<MockLandingPage />);
    
    // Check for Main Heading
    expect(screen.getByText(/Find Trusted Local/i)).toBeTruthy();
    
    // Check for "Book a Service" button
    const bookButtons = screen.getAllByText(/Book a Service/i);
    expect(bookButtons.length).toBeGreaterThan(0);
  });

  it('renders popular services section', async () => {
    render(<MockLandingPage />);
    // Check for Section Title
    expect(screen.getByText(/Popular Services/i)).toBeTruthy();
  });
});
