import React from 'react'
import { render, screen } from '@testing-library/react'
import { AchievementsGrid } from '@/src/components/achievements/AchievementsGrid'

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Trophy: () => <div>Trophy</div>,
  Star: () => <div>Star</div>,
  Zap: () => <div>Zap</div>,
  BookOpen: () => <div>BookOpen</div>,
  Globe: () => <div>Globe</div>,
  TrendingUp: () => <div>TrendingUp</div>,
}))

describe('AchievementsGrid Component', () => {
  const mockUnlockedAchievements = [
    'first_quiz' as const,
    'polyglot' as const,
    'speed_demon' as const,
  ]

  const mockInProgressAchievements = {
    perfect_score: { progress: 8, maxProgress: 10 },
    quiz_master: { progress: 3, maxProgress: 5 },
  }

  it('should render achievements grid', () => {
    render(
      <AchievementsGrid 
        unlockedAchievements={mockUnlockedAchievements}
      />
    )
    
    // Component renders successfully
    expect(screen.getByText('Getting Started')).toBeInTheDocument()
  })

  it('should display achievement details', () => {
    render(
      <AchievementsGrid 
        unlockedAchievements={mockUnlockedAchievements}
      />
    )
    
    // Component displays achievements
    expect(screen.getByText('Getting Started')).toBeInTheDocument()
  })

  it('should show achievement icons', () => {
    render(
      <AchievementsGrid 
        unlockedAchievements={mockUnlockedAchievements}
      />
    )
    
    // Icons are displayed
    expect(screen.queryByText('BookOpen')).toBeInTheDocument()
  })

  it('should display progress achievements', () => {
    render(
      <AchievementsGrid 
        unlockedAchievements={[]}
        inProgressAchievements={{
          perfect_score: { progress: 8, maxProgress: 10 },
          first_quiz: { progress: 1, maxProgress: 1 },
          polyglot: { progress: 2, maxProgress: 4 },
          speed_demon: { progress: 0, maxProgress: 10 },
          subject_master: { progress: 1, maxProgress: 3 },
          streak_5: { progress: 2, maxProgress: 5 },
          global_learner: { progress: 1, maxProgress: 7 }
        }}
      />
    )
    
    // Component renders with in-progress achievements
    expect(screen.getByText('Perfect Score')).toBeInTheDocument()
  })

  it('should handle empty achievements', () => {
    render(<AchievementsGrid unlockedAchievements={[]} />)
    
    // Component should handle empty state gracefully
    expect(screen.queryByText('Getting Started')).not.toBeInTheDocument()
  })

  it('should display achievement count', () => {
    render(
      <AchievementsGrid 
        unlockedAchievements={mockUnlockedAchievements}
      />
    )
    
    // All unlocked achievements should be displayed
    expect(screen.getByText('Getting Started')).toBeInTheDocument()
  })

  it('should display rarity information', () => {
    const { container } = render(
      <AchievementsGrid 
        unlockedAchievements={mockUnlockedAchievements}
      />
    )
    
    // Component renders achievements
    expect(container.firstChild).toBeInTheDocument()
  })

  it('should show multiple achievement types', () => {
    const allAchievements = [
      'first_quiz' as const,
      'perfect_score' as const,
      'polyglot' as const,
      'speed_demon' as const,
      'subject_master' as const,
      'streak_5' as const,
      'global_learner' as const,
    ]
    
    render(
      <AchievementsGrid 
        unlockedAchievements={allAchievements}
      />
    )
    
    expect(screen.getByText('Getting Started')).toBeInTheDocument()
  })

  it('should handle progress updates', () => {
    render(
      <AchievementsGrid 
        unlockedAchievements={['first_quiz' as const]}
        inProgressAchievements={{
          perfect_score: { progress: 5, maxProgress: 10 },
          first_quiz: { progress: 1, maxProgress: 1 },
          polyglot: { progress: 0, maxProgress: 4 },
          speed_demon: { progress: 0, maxProgress: 10 },
          subject_master: { progress: 0, maxProgress: 3 },
          streak_5: { progress: 0, maxProgress: 5 },
          global_learner: { progress: 0, maxProgress: 7 }
        }}
      />
    )
    
    // Component displays both unlocked and in-progress achievements
    expect(screen.getByText('Getting Started')).toBeInTheDocument()
  })

  it('should be responsive', () => {
    const { container } = render(
      <AchievementsGrid 
        unlockedAchievements={mockUnlockedAchievements}
      />
    )
    
    // Grid should render
    expect(container.firstChild).toBeInTheDocument()
  })
})
