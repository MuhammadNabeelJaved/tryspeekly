import asyncHandler from '../utils/asyncHandler.js'
import FAQ from '../models/faq.model.js'

// GET /api/v1/faqs — public: active FAQs
export const getAllFAQs = asyncHandler(async (req, res) => {
  try {
    const { category } = req.query
    const filter = { isActive: true }
    if (category) filter.category = category

    const faqs = await FAQ.find(filter).sort({ order: 1, createdAt: 1 })
    res.json({ success: true, data: faqs })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// POST /api/v1/faqs — admin: create FAQ
export const createFAQ = asyncHandler(async (req, res) => {
  try {
    const { question, answer, category, order } = req.body
    if (!question || !answer) {
      return res.status(400).json({ success: false, error: { message: 'Question and answer are required' } })
    }

    const faq = await FAQ.create({ question, answer, category, order })
    res.status(201).json({ success: true, message: 'FAQ created', data: faq })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// PATCH /api/v1/faqs/:id — admin: update FAQ
export const updateFAQ = asyncHandler(async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id)
    if (!faq) return res.status(404).json({ success: false, error: { message: 'FAQ not found' } })

    const allowed = ['question', 'answer', 'category', 'order', 'isActive']
    allowed.forEach((f) => { if (req.body[f] !== undefined) faq[f] = req.body[f] })
    await faq.save()

    res.json({ success: true, message: 'FAQ updated', data: faq })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// DELETE /api/v1/faqs/:id — admin
export const deleteFAQ = asyncHandler(async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id)
    if (!faq) return res.status(404).json({ success: false, error: { message: 'FAQ not found' } })
    res.json({ success: true, message: 'FAQ deleted' })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// PATCH /api/v1/faqs/reorder — admin: update display order
export const reorderFAQs = asyncHandler(async (req, res) => {
  try {
    const { orders } = req.body // [{ id, order }]
    if (!Array.isArray(orders)) {
      return res.status(400).json({ success: false, error: { message: 'orders must be an array of { id, order }' } })
    }

    await Promise.all(orders.map(({ id, order }) => FAQ.findByIdAndUpdate(id, { order })))
    res.json({ success: true, message: 'FAQs reordered' })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})
