/**
 * HomePage Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HomePage } from '../HomePage';
import * as homeService from '@services/home/home.service';

// Mock HomeService
vi.mock('@services/home/home.service', () => ({
  HomeService: {
    getRecentTasks: vi.fn(),
    getSuggestedActions: vi.fn(),
    getAIProviders: vi.fn(),
    getSystemStatus: vi.fn(),
    executeAction: vi.fn(),
  },
}));

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock implementations
    (homeService.HomeService.getRecentTasks as any).mockResolvedValue([
      {
        id: '1',
        goal: 'Research TypeScript',
        status: 'completed',
        timestamp: new Date(),
        result: 'Found articles',
        confidence: 0.92,
      },
    ]);

    (homeService.HomeService.getSuggestedActions as any).mockResolvedValue([
      {
        id: 'research-company',
        title: 'Research a Company',
        description: 'Deep dive into company details',
        icon: '🏢',
        category: 'research',
        action: vi.fn(),
        tags: ['business', 'research'],
      },
    ]);

    (homeService.HomeService.getAIProviders as any).mockResolvedValue([
      {
        id: 'openai',
        name: 'OpenAI',
        status: 'connected',
        model: 'GPT-4',
        lastUsed: new Date(),
      },
    ]);

    (homeService.HomeService.getSystemStatus as any).mockResolvedValue('ready');
  });

  it('should render home page with title', async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Nova Browser')).toBeTruthy();
    });
  });

  it('should render search bar with placeholder', async () => {
    render(<HomePage />);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(
        'What would you like to accomplish?'
      ) as HTMLInputElement;
      expect(searchInput).toBeTruthy();
    });
  });

  it('should render AI status widget', async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('AI Status')).toBeTruthy();
    });
  });

  it('should render recent tasks section', async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Recent Tasks')).toBeTruthy();
    });
  });

  it('should render suggested actions section', async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Suggested Actions')).toBeTruthy();
    });
  });

  it('should render workflow shortcuts section', async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Your Workflows')).toBeTruthy();
    });
  });

  it('should load and display recent tasks', async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Research TypeScript')).toBeTruthy();
    });
  });

  it('should load and display AI providers', async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('OpenAI')).toBeTruthy();
    });
  });

  it('should display suggested actions', async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Research a Company')).toBeTruthy();
    });
  });

  it('should handle search input', async () => {
    render(<HomePage />);

    const searchInput = (await screen.findByPlaceholderText(
      'What would you like to accomplish?'
    )) as HTMLInputElement;

    fireEvent.change(searchInput, { target: { value: 'Test search' } });
    expect(searchInput.value).toBe('Test search');
  });

  it('should show suggested searches', async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Research a company')).toBeTruthy();
      expect(screen.getByText('Find best laptop')).toBeTruthy();
    });
  });

  it('should display confidence score for completed tasks', async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('92%')).toBeTruthy();
      expect(screen.getByText('confidence')).toBeTruthy();
    });
  });

  it('should render footer with version info', async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/Phase 3 Week 1/)).toBeTruthy();
    });
  });
});
