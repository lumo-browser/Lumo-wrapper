/**
 * Home Components Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from '../SearchBar';
import { RecentTasks } from '../RecentTasks';
import { QuickActions } from '../QuickActions';
import { AIStatusWidget } from '../AIStatusWidget';
import { ProviderStatus } from '../ProviderStatus';
import { WorkflowShortcuts } from '../WorkflowShortcuts';
import { RecentTask, QuickAction, AIProvider } from '@types/home.types';

// ===== SearchBar Tests =====
describe('SearchBar', () => {
  it('should render search input', () => {
    const mockSearch = vi.fn();
    render(<SearchBar onSearch={mockSearch} />);

    const input = screen.getByPlaceholderText('What would you like to accomplish?');
    expect(input).toBeTruthy();
  });

  it('should call onSearch when form is submitted', () => {
    const mockSearch = vi.fn();
    render(<SearchBar onSearch={mockSearch} />);

    const input = screen.getByPlaceholderText('What would you like to accomplish?') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Test query' } });
    fireEvent.submit(input.form!);

    expect(mockSearch).toHaveBeenCalledWith('Test query');
  });

  it('should clear input after search', () => {
    const mockSearch = vi.fn();
    render(<SearchBar onSearch={mockSearch} />);

    const input = screen.getByPlaceholderText('What would you like to accomplish?') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.submit(input.form!);

    expect(input.value).toBe('');
  });

  it('should show suggested searches', () => {
    const mockSearch = vi.fn();
    render(<SearchBar onSearch={mockSearch} />);

    expect(screen.getByText('Research a company')).toBeTruthy();
    expect(screen.getByText('Find product alternatives')).toBeTruthy();
  });
});

// ===== RecentTasks Tests =====
describe('RecentTasks', () => {
  it('should display empty state when no tasks', () => {
    render(<RecentTasks tasks={[]} />);
    expect(screen.getByText(/No recent tasks/)).toBeTruthy();
  });

  it('should display tasks', () => {
    const tasks: RecentTask[] = [
      {
        id: '1',
        goal: 'Research TypeScript',
        status: 'completed',
        timestamp: new Date(),
        result: 'Found 15 articles',
        confidence: 0.92,
      },
    ];

    render(<RecentTasks tasks={tasks} />);

    expect(screen.getByText('Research TypeScript')).toBeTruthy();
    expect(screen.getByText('Found 15 articles')).toBeTruthy();
  });

  it('should display task status', () => {
    const tasks: RecentTask[] = [
      {
        id: '1',
        goal: 'Test task',
        status: 'completed',
        timestamp: new Date(),
      },
    ];

    render(<RecentTasks tasks={tasks} />);
    expect(screen.getByText('Completed')).toBeTruthy();
  });

  it('should display confidence score', () => {
    const tasks: RecentTask[] = [
      {
        id: '1',
        goal: 'Test task',
        status: 'completed',
        timestamp: new Date(),
        confidence: 0.95,
      },
    ];

    render(<RecentTasks tasks={tasks} />);
    expect(screen.getByText('95%')).toBeTruthy();
  });
});

// ===== QuickActions Tests =====
describe('QuickActions', () => {
  it('should display empty state when no actions', () => {
    render(<QuickActions actions={[]} />);
    expect(screen.getByText(/No suggestions/)).toBeTruthy();
  });

  it('should display action buttons', () => {
    const actions: QuickAction[] = [
      {
        id: 'research',
        title: 'Research',
        description: 'Research description',
        icon: '',
        category: 'research',
        action: vi.fn(),
        tags: ['research'],
      },
    ];

    render(<QuickActions actions={actions} />);
    expect(screen.getByText('Research')).toBeTruthy();
    expect(screen.getByText('Research description')).toBeTruthy();
  });

  it('should call action when button clicked', () => {
    const mockAction = vi.fn();
    const actions: QuickAction[] = [
      {
        id: 'research',
        title: 'Research',
        description: 'Research description',
        icon: '',
        category: 'research',
        action: mockAction,
        tags: ['research'],
      },
    ];

    render(<QuickActions actions={actions} />);
    const button = screen.getByText('Research');
    fireEvent.click(button);

    expect(mockAction).toHaveBeenCalled();
  });
});

// ===== AIStatusWidget Tests =====
describe('AIStatusWidget', () => {
  it('should display ready status', () => {
    render(<AIStatusWidget status="ready" />);
    expect(screen.getByText('System Ready')).toBeTruthy();
  });

  it('should display busy status', () => {
    render(<AIStatusWidget status="busy" />);
    expect(screen.getByText('Processing')).toBeTruthy();
  });

  it('should display error status', () => {
    render(<AIStatusWidget status="error" />);
    expect(screen.getByText('System Error')).toBeTruthy();
  });

  it('should always show system status label', () => {
    render(<AIStatusWidget status="ready" />);
    expect(screen.getByText('System Status')).toBeTruthy();
  });
});

// ===== ProviderStatus Tests =====
describe('ProviderStatus', () => {
  it('should display empty state when no providers', () => {
    render(<ProviderStatus providers={[]} />);
    expect(screen.getByText(/No AI providers/)).toBeTruthy();
  });

  it('should display connected providers', () => {
    const providers: AIProvider[] = [
      {
        id: 'openai',
        name: 'OpenAI',
        status: 'connected',
        model: 'GPT-4',
      },
    ];

    render(<ProviderStatus providers={providers} />);
    expect(screen.getByText('OpenAI')).toBeTruthy();
    expect(screen.getByText('GPT-4')).toBeTruthy();
  });

  it('should display disconnected status', () => {
    const providers: AIProvider[] = [
      {
        id: 'claude',
        name: 'Claude',
        status: 'disconnected',
      },
    ];

    render(<ProviderStatus providers={providers} />);
    expect(screen.getByText('Claude')).toBeTruthy();
  });
});

// ===== WorkflowShortcuts Tests =====
describe('WorkflowShortcuts', () => {
  it('should display default workflows', () => {
    render(<WorkflowShortcuts />);

    expect(screen.getByText('Daily News Digest')).toBeTruthy();
    expect(screen.getByText('Market Monitor')).toBeTruthy();
    expect(screen.getByText('Price Tracker')).toBeTruthy();
  });

  it('should call onExecute when workflow is clicked', () => {
    const mockExecute = vi.fn();
    render(<WorkflowShortcuts onExecute={mockExecute} />);

    const button = screen.getByText('Daily News Digest');
    fireEvent.click(button);

    expect(mockExecute).toHaveBeenCalledWith('daily-news');
  });

  it('should display workflow frequency', () => {
    render(<WorkflowShortcuts />);

    expect(screen.getAllByText('Daily').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Hourly')).toBeTruthy();
    expect(screen.getByText('Every 6h')).toBeTruthy();
  });
});
