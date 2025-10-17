describe('API Integration Tests', () => {
  const API_BASE = 'http://localhost:3001/api'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Multilingual Quiz Endpoints', () => {
    it('should fetch all quizzes', async () => {
      const response = await fetch(`${API_BASE}/quizzes/multilingual`)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
    })

    it('should fetch quiz with filters', async () => {
      const params = new URLSearchParams({
        search: 'React',
        difficulty: 'easy,medium',
        language: 'en,hi',
        limit: '10',
      })
      
      const response = await fetch(`${API_BASE}/quizzes/multilingual?${params}`)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should fetch single quiz by ID', async () => {
      // First get a quiz
      const listResponse = await fetch(`${API_BASE}/quizzes/multilingual`)
      const listData = await listResponse.json()
      
      if (listData.data.length > 0) {
        const quizId = listData.data[0].id
        const response = await fetch(`${API_BASE}/quizzes/multilingual/${quizId}`)
        expect(response.status).toBe(200)
        
        const data = await response.json()
        expect(data.success).toBe(true)
        expect(data.data.id).toBe(quizId)
      }
    })

    it('should support date range filtering', async () => {
      const params = new URLSearchParams({
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
      })
      
      const response = await fetch(`${API_BASE}/quizzes/multilingual?${params}`)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should support score range filtering', async () => {
      const params = new URLSearchParams({
        scoreMin: '70',
        scoreMax: '100',
      })
      
      const response = await fetch(`${API_BASE}/quizzes/multilingual?${params}`)
      expect(response.status).toBe(200)
    })

    it('should support pagination', async () => {
      const params1 = new URLSearchParams({ limit: '5', offset: '0' })
      const params2 = new URLSearchParams({ limit: '5', offset: '5' })
      
      const response1 = await fetch(`${API_BASE}/quizzes/multilingual?${params1}`)
      const response2 = await fetch(`${API_BASE}/quizzes/multilingual?${params2}`)
      
      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)
    })

    it('should fetch quiz recommendations', async () => {
      const response = await fetch(`${API_BASE}/user/quiz-recommendations`)
      
      // May require authentication
      if (response.status !== 401) {
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.success).toBe(true)
      }
    })
  })

  describe('Achievement Endpoints', () => {
    it('should fetch achievements list', async () => {
      const response = await fetch(`${API_BASE}/achievements`)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
    })

    it('should fetch achievement leaderboard', async () => {
      const response = await fetch(`${API_BASE}/achievements/leaderboard`)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
    })

    it('should fetch user achievement stats', async () => {
      const response = await fetch(`${API_BASE}/achievements/stats`)
      
      // May require authentication
      if (response.status !== 401) {
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.success).toBe(true)
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid quiz ID', async () => {
      const response = await fetch(`${API_BASE}/quizzes/multilingual/invalid-id`)
      expect([400, 404, 500]).toContain(response.status)
    })

    it('should handle invalid filter parameters', async () => {
      const params = new URLSearchParams({
        difficulty: 'invalid',
      })
      
      const response = await fetch(`${API_BASE}/quizzes/multilingual?${params}`)
      // Should either ignore invalid or return error
      expect([200, 400]).toContain(response.status)
    })

    it('should handle malformed requests', async () => {
      const response = await fetch(`${API_BASE}/quizzes/multilingual?limit=abc`)
      expect([200, 400]).toContain(response.status)
    })
  })

  describe('Performance Tests', () => {
    it('should respond within 1 second for basic query', async () => {
      const start = Date.now()
      const response = await fetch(`${API_BASE}/quizzes/multilingual?limit=10`)
      const duration = Date.now() - start
      
      expect(response.status).toBe(200)
      expect(duration).toBeLessThan(1000)
    })

    it('should handle concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        fetch(`${API_BASE}/quizzes/multilingual`)
      )
      
      const responses = await Promise.all(requests)
      expect(responses.every(r => r.status === 200)).toBe(true)
    })
  })
})
