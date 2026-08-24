const express = require('express');
const {
  listBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} = require('../controllers/budgetController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', listBudgets);
router.post('/', createBudget);
router.patch('/:id', updateBudget);
router.delete('/:id', deleteBudget);

module.exports = router;
