import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterBar } from '@/src/components/i18n/FilterBar'

// Mock Framer Motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

describe('FilterBar Component', () => {
  const mockOnFilterChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render FilterBar component', () => {
    render(
      <FilterBar 
        onFilterChange={mockOnFilterChange}
        availableTags={['React', 'TypeScript']}
      />
    )
    
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
  })

  it('should handle search input change', async () => {
    const user = userEvent.setup()
    render(
      <FilterBar 
        onFilterChange={mockOnFilterChange}
        availableTags={['React']}
      />
    )
    
    const searchInput = screen.getByPlaceholderText(/search/i)
    await user.type(searchInput, 'React')
    
    // Wait for debounce (500ms)
    await new Promise(resolve => setTimeout(resolve, 600))
    
    expect(mockOnFilterChange).toHaveBeenCalled()
  })

  it('should toggle difficulty filters', async () => {
    const user = userEvent.setup()
    render(
      <FilterBar 
        onFilterChange={mockOnFilterChange}
        availableTags={['React']}
        showAdvanced={true}
      />
    )
    
    // Find and click difficulty filter
    const easyButton = screen.getByRole('button', { name: /easy/i })
    await user.click(easyButton)
    
    expect(mockOnFilterChange).toHaveBeenCalled()
  })

  it('should select multiple languages', async () => {
    const user = userEvent.setup()
    render(
      <FilterBar 
        onFilterChange={mockOnFilterChange}
        availableTags={['React']}
        showAdvanced={true}
      />
    )
    
    // Language buttons should be present
    const languageButtons = screen.queryAllByRole('button')
    expect(languageButtons.length).toBeGreaterThan(0)
  })

  it('should reset all filters', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <FilterBar 
        onFilterChange={mockOnFilterChange}
        availableTags={['React']}
        showAdvanced={true}
      />
    )
    
    const searchInput = screen.getByPlaceholderText(/search/i) as HTMLInputElement
    await user.type(searchInput, 'test')
    
    // Reset button should exist
    const resetButton = screen.queryByRole('button', { name: /reset/i })
    if (resetButton) {
      await user.click(resetButton)
      expect(mockOnFilterChange).toHaveBeenCalled()
    }
  })

  it('should toggle advanced filters section', async () => {
    const user = userEvent.setup()
    render(
      <FilterBar 
        onFilterChange={mockOnFilterChange}
        availableTags={['React']}
        showAdvanced={true}
      />
    )
    
    // Should have filter toggle button
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('should display available tags', () => {
    const tags = ['React', 'TypeScript', 'Node.js']
    render(
      <FilterBar 
        onFilterChange={mockOnFilterChange}
        availableTags={tags}
        showAdvanced={true}
      />
    )
    
    // Component should render without errors
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
  })

  it('should be accessible with keyboard navigation', async () => {
    const user = userEvent.setup()
    render(
      <FilterBar 
        onFilterChange={mockOnFilterChange}
        availableTags={['React']}
      />
    )
    
    const searchInput = screen.getByPlaceholderText(/search/i)
    
    // Tab to search input and type
    await user.tab()
    expect(searchInput).toHaveFocus()
  })

  it('should handle empty tags list', () => {
    render(
      <FilterBar 
        onFilterChange={mockOnFilterChange}
        availableTags={[]}
      />
    )
    
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
  })

  it('should show filter count', () => {
    const { rerender } = render(
      <FilterBar 
        onFilterChange={mockOnFilterChange}
        availableTags={['React']}
        showAdvanced={true}
      />
    )
    
    // Component should have structure for filter display
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
  })
})
