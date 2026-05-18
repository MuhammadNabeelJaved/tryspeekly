import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import StudentOverview from '../StudentOverview'

vi.mock('@/services/enrollments.service', () => ({
  enrollmentsService: { getMyEnrollments: vi.fn().mockResolvedValue({ success: true, data: [] }) },
}))
vi.mock('@/services/live-class.service', () => ({
  liveClassService: { getStudentUpcomingClasses: vi.fn().mockResolvedValue({ success: true, data: [] }) },
}))
vi.mock('@/services/assignments.service', () => ({
  assignmentsService: { getMyAssignments: vi.fn().mockResolvedValue({ success: true, data: [] }) },
}))
vi.mock('@/services/announcements.service', () => ({
  announcementsService: { getMyAnnouncements: vi.fn().mockResolvedValue({ success: true, data: [] }) },
}))
vi.mock('@/services/payments.service', () => ({
  paymentsService: { getMyPayments: vi.fn().mockResolvedValue({ success: true, data: [] }) },
}))
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Test Student', _id: 'student1' } }),
}))

// Fake socket that captures registered handlers
const handlers: Record<string, (payload: unknown) => void> = {}
const mockSocket = {
  on: vi.fn((event: string, handler: (payload: unknown) => void) => {
    handlers[event] = handler
  }),
  off: vi.fn((event: string) => {
    delete handlers[event]
  }),
}

vi.mock('@/context/SocketContext', () => ({
  useSocket: () => ({ socket: mockSocket, isConnected: true }),
}))

const renderComponent = () =>
  render(
    <BrowserRouter>
      <StudentOverview onNavigate={vi.fn()} />
    </BrowserRouter>
  )

const mockLiveClass = {
  _id: 'lc1',
  course: { _id: 'c1', title: 'English Basics', totalSessions: 20 },
  teacher: { _id: 't1', name: 'Mr. Ahmed', profileImage: '' },
  meetingLink: 'https://meet.google.com/abc-defg-hij',
  classNumber: 1,
  scheduledAt: null,
  createdAt: new Date().toISOString(),
  status: 'active' as const,
}

describe('StudentOverview — socket live-class events', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(handlers).forEach((k) => delete handlers[k])
  })

  it('shows "Join Live Class" button when live-class:updated fires with active status', async () => {
    renderComponent()

    // Drain fetchAll's async operations so the initial empty API result settles
    // before the socket event fires, preventing a race condition in test
    await act(async () => { await Promise.resolve() })

    await act(async () => {
      handlers['live-class:updated']?.(mockLiveClass)
    })

    expect(screen.getByText(/join live class/i)).toBeInTheDocument()
  })

  it('removes the join button when live-class:updated fires with completed status', async () => {
    renderComponent()

    await act(async () => {
      handlers['live-class:updated']?.(mockLiveClass)
    })

    await act(async () => {
      handlers['live-class:updated']?.({ ...mockLiveClass, status: 'completed' })
    })

    expect(screen.queryByText(/join live class/i)).not.toBeInTheDocument()
  })

  it('removes the join button when live-class:updated fires with cancelled status', async () => {
    renderComponent()

    await act(async () => {
      handlers['live-class:updated']?.(mockLiveClass)
    })

    await act(async () => {
      handlers['live-class:updated']?.({ ...mockLiveClass, status: 'cancelled' })
    })

    expect(screen.queryByText(/join live class/i)).not.toBeInTheDocument()
  })

  it('removes the join button when live-class:deleted fires', async () => {
    renderComponent()

    await act(async () => {
      handlers['live-class:updated']?.(mockLiveClass)
    })

    await act(async () => {
      handlers['live-class:deleted']?.({ _id: 'lc1' })
    })

    expect(screen.queryByText(/join live class/i)).not.toBeInTheDocument()
  })

  it('upserts without duplicating when same _id fires twice', async () => {
    renderComponent()

    await act(async () => {
      handlers['live-class:updated']?.(mockLiveClass)
    })
    await act(async () => {
      handlers['live-class:updated']?.(mockLiveClass)
    })

    expect(screen.getAllByText(/join live class/i)).toHaveLength(1)
  })

  it('registers and cleans up both socket listeners with the same function reference on unmount', () => {
    const { unmount } = renderComponent()

    const updatedHandler = mockSocket.on.mock.calls.find(([e]) => e === 'live-class:updated')?.[1]
    const deletedHandler = mockSocket.on.mock.calls.find(([e]) => e === 'live-class:deleted')?.[1]

    expect(updatedHandler).toBeDefined()
    expect(deletedHandler).toBeDefined()

    unmount()

    expect(mockSocket.off).toHaveBeenCalledWith('live-class:updated', updatedHandler)
    expect(mockSocket.off).toHaveBeenCalledWith('live-class:deleted', deletedHandler)
  })
})
