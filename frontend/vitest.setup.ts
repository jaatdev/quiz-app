import '@testing-library/jest-dom'
import { vi } from 'vitest'
import * as React from 'react'

// Ensure React is available globally for modules that use JSX without import in tests
;(globalThis as any).React = React

// Provide minimal global types for vi-based mocks in tests
declare global {
	var vi: any
}

// Mock next/navigation
vi.mock('next/navigation', () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		prefetch: vi.fn(),
		back: vi.fn(),
		forward: vi.fn(),
	}),
	usePathname: () => '/quiz/multilingual',
	useSearchParams: () => new URLSearchParams(),
}))

// Mock @clerk/nextjs
vi.mock('@clerk/nextjs', () => ({
	ClerkProvider: ({ children }: any) => children,
	SignInButton: () => null,
	SignUpButton: () => null,
	UserButton: () => null,
	useAuth: () => ({
		userId: 'test-user-id',
		isLoaded: true,
		isSignedIn: true,
		getToken: vi.fn(),
	}),
	useUser: () => ({ user: { id: 'test-user', firstName: 'Test' }, isSignedIn: true }),
}))

// Mock @clerk/clerk-react
vi.mock('@clerk/clerk-react', () => ({
	useAuth: () => ({
		userId: 'test-user-id',
		isLoaded: true,
		isSignedIn: true,
		getToken: vi.fn(),
	}),
}))

// Mock toast provider to avoid rendering icons/components that use JSX at module scope
vi.mock('@/providers/toast-provider', () => ({
	useToast: () => ({ showToast: () => {} }),
}));

// Suppress console errors in tests
const originalError = console.error
beforeAll(() => {
	console.error = (...args: any[]) => {
		if (
			typeof args[0] === 'string' &&
			(args[0].includes('Warning: ReactDOM.render') ||
				args[0].includes('Not implemented: HTMLFormElement.prototype.submit'))
		) {
			return
		}
		originalError.call(console, ...args)
	}
})

afterAll(() => {
	console.error = originalError
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
})

// Global fetch mock to avoid real network calls during tests
;(globalThis as any).fetch = vi.fn((input: RequestInfo, init?: RequestInit) => {
	const url = typeof input === 'string' ? input : input.url;
	// provide safe defaults for known endpoints used in tests
	if (url.includes('/admin/subjects')) {
		return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
	}
	if (url.includes('/api/admin/audit-logs') || url.includes('/admin/audit-logs')) {
		const sample = {
			items: [
				{ id: '1', event: 'LANGUAGE_PRUNED', actorId: 'u1', actorEmail: 'a@example.com', quizId: 'q1', languagesFound: ['en','hi','es'], languagesPruned: ['es'], forcedMultilingual: true, meta: {}, createdAt: new Date().toISOString() }
			],
			total: 1,
			page: 1,
			pageSize: 20,
			totalPages: 1,
		}
		return Promise.resolve({ ok: true, json: () => Promise.resolve(sample) })
	}
	// Default: return empty array for GET requests, 200 OK
	if (!init || (init && (!init.method || init.method.toUpperCase() === 'GET'))) {
		return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
	}
	return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
})
