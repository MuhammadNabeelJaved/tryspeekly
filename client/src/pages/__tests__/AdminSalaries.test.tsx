import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import AdminSalaries from '../admin/AdminSalaries'

vi.mock('@/services/salary.service', () => ({
  salaryService: {
    getAllPackages: vi.fn().mockResolvedValue({ data: [] }),
    getPackagePayments: vi.fn().mockResolvedValue({ data: [] }),
    addPayment: vi.fn().mockResolvedValue({ data: { _id: 'p1', amount: 75000, periodStart: '2026-05-01', status: 'paid', paymentMethod: 'jazzcash' } }),
    updatePayment: vi.fn().mockResolvedValue({ data: {} }),
    deletePayment: vi.fn().mockResolvedValue({}),
    createPackage: vi.fn().mockResolvedValue({ data: { _id: 'pkg1', teacher: { _id: 't1', name: 'Ali Khan', email: 'ali@test.com' }, amount: 50000, type: 'monthly', startDate: '2026-01-01', status: 'active' } }),
    updatePackage: vi.fn().mockResolvedValue({ data: {} }),
    deletePackage: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('@/lib/axiosClient', () => ({
  axiosClient: {
    get: vi.fn().mockResolvedValue({
      data: {
        data: [{ _id: 'teacher1', name: 'Ali Khan', email: 'ali@test.com', role: 'teacher' }],
      },
    }),
  },
}))

const renderWithRouter = (ui: React.ReactElement) =>
  render(<BrowserRouter>{ui}</BrowserRouter>)

describe('AdminSalaries — payment method selector', () => {
  it('renders the component without crashing', async () => {
    renderWithRouter(<AdminSalaries />)
    expect(await screen.findByText('Salary Management')).toBeInTheDocument()
  })

  it('shows "Search payment method" placeholder when payment form is open', async () => {
    renderWithRouter(<AdminSalaries />)
    const teacherBtn = await screen.findByText('Ali Khan')
    fireEvent.click(teacherBtn)

    // Create a package first so the payment form can appear
    const createBtn = screen.getByRole('button', { name: /create package/i })
    fireEvent.submit(createBtn.closest('form')!)

    // Wait for "Add Payment" button to appear after package is created, then click it
    const addPaymentBtn = await screen.findByRole('button', { name: /add payment/i })
    fireEvent.click(addPaymentBtn)

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/search payment method/i)).not.toBeNull()
    })
  })
})
