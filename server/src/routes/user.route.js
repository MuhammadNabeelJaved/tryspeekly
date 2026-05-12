const express = require('express')
const router = express.Router()
const { asyncHandler } = require('../utils/asyncHandler')
const userController = require('../controllers/user.controller')

router.get('/profile', asyncHandler(userController.getProfile))
router.put('/profile', asyncHandler(userController.updateProfile))
router.put('/password', asyncHandler(userController.updatePassword))
router.delete('/account', asyncHandler(userController.deleteAccount))

module.exports = router