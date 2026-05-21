import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import InstructorSalary from '../instructor/InstructorSalary'

vi.mock('@/services/salary.service', () => ({
  salaryService: {
    getMyPackage: vi.fn().mockResolvedValue({
      data: {
        package: {
          _id: 'pkg1',
          teacher: { _id: 'teacher1', name: 'Ali Khan', email: 'ali@example.com' },
          amount: 75000,
          type: 'monthly',
          startDate: '2026-01-01T00:00:00.000Z',
          status: 'active',
        },
        payments: [
          {
            _id: 'pay1',
            package: 'pkg1',
            teacher: 'teacher1',
            amount: 75000,
            periodStart: '2026-05-01T00:00:00.000Z',
            periodLabel: 'May 2026',
            status: 'paid',
            paidDate: '2026-05-05T00:00:00.000Z',
            paymentMethod: 'jazzcash',
          },
          {
            _id: 'pay2',
            package: 'pkg1',
            teacher: 'teacher1',
            amount: 75000,
            periodStart: '2026-04-01T00:00:00.000Z',
            periodLabel: 'April 2026',
            status: 'pending',
          },
        ],
      },
    }),
  },
}))

describe('InstructorSalary — payment method column', () => {
  it('renders "Payment Method" column header in the payments table', async () => {
    render(<InstructorSalary />)
    expect(await screen.findByText(/payment method/i)).toBeInTheDocument()
  })

  it('shows the method name for a payment with a known paymentMethod id', async () => {
    render(<InstructorSalary />)
    expect(await screen.findByText('JazzCash')).toBeInTheDocument()
  })

  it('shows a dash for a payment with no paymentMethod', async () => {
    render(<InstructorSalary />)
    // The dash renders as text content in the cell
    const cells = await screen.findAllByText('—')
    expect(cells.length).toBeGreaterThan(0)
  })
})
