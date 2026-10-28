const express = require('express');
const router = express.Router();

const {
  getGoals,
  getGoalsSummary,
  createGoal,
  updateGoal,
  addFunds,
  deleteGoal
} = require('../controllers/goalController');

// Analytics summary route (defined first to prevent conflict with parameter routes)
router.get('/summary', getGoalsSummary);

// Collection routes
router.route('/')
  .get(getGoals)
  .post(createGoal);

// Single goal resource routes
router.route('/:id')
  .put(updateGoal)
  .delete(deleteGoal);

// Custom action route for deposit/add-funds
router.patch('/:id/add-funds', addFunds);

module.exports = router;
