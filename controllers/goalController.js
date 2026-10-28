const mongoose = require('mongoose');
const Goal = require('../models/Goal');

/**
 * Helper: Validate MongoDB ObjectId
 */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Helper: Check if date is strictly in the future (at least today)
 */
const isFutureOrToday = (dateInput) => {
  const target = new Date(dateInput);
  if (isNaN(target.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return target >= today;
};

/**
 * @desc    Get all savings goals for authenticated user
 * @route   GET /api/goals
 * @access  Private
 */
const getGoals = async (req, res) => {
  try {
    const { search, category, status, sort } = req.query;

    // Filter strictly by authenticated user
    const filter = { user: req.user._id };

    // Search query by title or description
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$and = [
        { $or: [{ title: searchRegex }, { description: searchRegex }] }
      ];
    }

    // Category filter
    if (category && category !== 'All') {
      filter.category = category;
    }

    // Status filter
    if (status === 'completed') {
      filter.isCompleted = true;
    } else if (status === 'in-progress') {
      filter.isCompleted = false;
    }

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    } else if (sort === 'deadline') {
      sortOption = { targetDate: 1 };
    } else if (sort === 'targetHigh') {
      sortOption = { targetAmount: -1 };
    } else if (sort === 'targetLow') {
      sortOption = { targetAmount: 1 };
    }

    let goals = await Goal.find(filter).sort(sortOption);

    if (sort === 'progressHigh') {
      goals = goals.sort((a, b) => {
        const pA = (a.currentAmount / a.targetAmount) * 100;
        const pB = (b.currentAmount / b.targetAmount) * 100;
        return pB - pA;
      });
    }

    return res.status(200).json({
      success: true,
      count: goals.length,
      data: goals
    });
  } catch (error) {
    console.error('Error in getGoals:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching goals',
      error: error.message
    });
  }
};

/**
 * @desc    Get analytics summary metadata for authenticated user
 * @route   GET /api/goals/summary
 * @access  Private
 */
const getGoalsSummary = async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user._id });

    const totalGoalsCount = goals.length;
    let totalTargetAmount = 0;
    let totalCurrentSavings = 0;
    let completedGoalsCount = 0;

    const categoryBreakdown = {};

    goals.forEach((goal) => {
      totalTargetAmount += Number(goal.targetAmount) || 0;
      totalCurrentSavings += Number(goal.currentAmount) || 0;
      if (goal.isCompleted) {
        completedGoalsCount += 1;
      }

      if (!categoryBreakdown[goal.category]) {
        categoryBreakdown[goal.category] = { count: 0, target: 0, saved: 0 };
      }
      categoryBreakdown[goal.category].count += 1;
      categoryBreakdown[goal.category].target += Number(goal.targetAmount) || 0;
      categoryBreakdown[goal.category].saved += Number(goal.currentAmount) || 0;
    });

    const inProgressGoalsCount = totalGoalsCount - completedGoalsCount;
    const overallProgress =
      totalTargetAmount > 0
        ? Math.min(100, Math.round((totalCurrentSavings / totalTargetAmount) * 1000) / 10)
        : 0;

    const remainingAmount = Math.max(0, totalTargetAmount - totalCurrentSavings);

    return res.status(200).json({
      success: true,
      data: {
        totalGoalsCount,
        completedGoalsCount,
        inProgressGoalsCount,
        totalTargetAmount: Math.round(totalTargetAmount * 100) / 100,
        totalCurrentSavings: Math.round(totalCurrentSavings * 100) / 100,
        remainingAmount: Math.round(remainingAmount * 100) / 100,
        overallProgress,
        categoryBreakdown
      }
    });
  } catch (error) {
    console.error('Error in getGoalsSummary:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while calculating goals summary',
      error: error.message
    });
  }
};

/**
 * @desc    Create a new savings goal for authenticated user
 * @route   POST /api/goals
 * @access  Private
 */
const createGoal = async (req, res) => {
  try {
    const { title, targetAmount, currentAmount = 0, category, targetDate, description = '' } = req.body;
    const validationErrors = [];

    // Title validation
    if (!title || typeof title !== 'string' || title.trim().length < 3 || title.trim().length > 50) {
      validationErrors.push('Goal title is required and must be between 3 and 50 characters.');
    }

    // Target amount validation
    const parsedTarget = Number(targetAmount);
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      validationErrors.push('Target amount must be a positive number greater than $0.');
    }

    // Current amount validation
    const parsedCurrent = Number(currentAmount);
    if (isNaN(parsedCurrent) || parsedCurrent < 0) {
      validationErrors.push('Current amount cannot be negative.');
    } else if (parsedCurrent > 1000000) {
      validationErrors.push('Current amount cannot exceed $1,000,000.');
    }

    // Category validation
    const validCategories = Goal.schema.path('category').enumValues;
    if (!category || !validCategories.includes(category)) {
      validationErrors.push(`Category must be one of: ${validCategories.join(', ')}.`);
    }

    // Target date validation
    if (!targetDate) {
      validationErrors.push('Target date is required.');
    } else {
      const parsedDate = new Date(targetDate);
      if (isNaN(parsedDate.getTime())) {
        validationErrors.push('Target date must be a valid date.');
      } else if (!isFutureOrToday(targetDate)) {
        validationErrors.push('Target date must be a future date (cannot be in the past).');
      }
    }

    // Description validation
    if (description && typeof description === 'string' && description.length > 250) {
      validationErrors.push('Description cannot exceed 250 characters.');
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database connection in progress or blocked. Please ensure IP 0.0.0.0/0 is enabled in MongoDB Atlas Network Access.'
      });
    }

    const isCompleted = parsedCurrent >= parsedTarget;

    const newGoal = await Goal.create({
      user: req.user._id,
      title: title.trim(),
      targetAmount: parsedTarget,
      currentAmount: parsedCurrent,
      category,
      targetDate: new Date(targetDate),
      description: description ? description.trim() : '',
      isCompleted
    });

    return res.status(201).json({
      success: true,
      message: 'Savings goal created successfully!',
      data: newGoal
    });
  } catch (error) {
    console.error('Error in createGoal:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating goal',
      error: error.message
    });
  }
};

/**
 * @desc    Update an existing savings goal
 * @route   PUT /api/goals/:id
 * @access  Private
 */
const updateGoal = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid goal ID format'
      });
    }

    const existingGoal = await Goal.findOne({
      _id: id,
      user: req.user._id
    });

    if (!existingGoal) {
      return res.status(404).json({
        success: false,
        message: `Goal not found or not authorized with ID: ${id}`
      });
    }

    const { title, targetAmount, currentAmount, category, targetDate, description } = req.body;
    const validationErrors = [];

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length < 3 || title.trim().length > 50) {
        validationErrors.push('Goal title must be between 3 and 50 characters.');
      } else {
        existingGoal.title = title.trim();
      }
    }

    if (targetAmount !== undefined) {
      const parsedTarget = Number(targetAmount);
      if (isNaN(parsedTarget) || parsedTarget <= 0) {
        validationErrors.push('Target amount must be a positive number greater than $0.');
      } else {
        existingGoal.targetAmount = parsedTarget;
      }
    }

    if (currentAmount !== undefined) {
      const parsedCurrent = Number(currentAmount);
      if (isNaN(parsedCurrent) || parsedCurrent < 0) {
        validationErrors.push('Current amount cannot be negative.');
      } else if (parsedCurrent > 1000000) {
        validationErrors.push('Current amount cannot exceed $1,000,000.');
      } else {
        existingGoal.currentAmount = parsedCurrent;
      }
    }

    if (category !== undefined) {
      const validCategories = Goal.schema.path('category').enumValues;
      if (!validCategories.includes(category)) {
        validationErrors.push(`Category must be one of: ${validCategories.join(', ')}.`);
      } else {
        existingGoal.category = category;
      }
    }

    if (targetDate !== undefined) {
      const parsedDate = new Date(targetDate);
      if (isNaN(parsedDate.getTime())) {
        validationErrors.push('Target date must be a valid date.');
      } else {
        existingGoal.targetDate = parsedDate;
      }
    }

    if (description !== undefined) {
      if (typeof description === 'string' && description.length > 250) {
        validationErrors.push('Description cannot exceed 250 characters.');
      } else {
        existingGoal.description = description.trim();
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    existingGoal.isCompleted = existingGoal.currentAmount >= existingGoal.targetAmount;
    const updatedGoal = await existingGoal.save();

    return res.status(200).json({
      success: true,
      message: 'Savings goal updated successfully!',
      data: updatedGoal
    });
  } catch (error) {
    console.error('Error in updateGoal:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating goal',
      error: error.message
    });
  }
};

/**
 * @desc    Add funds to goal currentAmount
 * @route   PATCH /api/goals/:id/add-funds
 * @access  Private
 */
const addFunds = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid goal ID format'
      });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid deposit amount greater than $0.'
      });
    }

    const goal = await Goal.findOne({
      _id: id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: `Goal not found or not authorized with ID: ${id}`
      });
    }

    const newTotal = goal.currentAmount + parsedAmount;
    if (newTotal > 1000000) {
      return res.status(400).json({
        success: false,
        message: `Adding $${parsedAmount} would exceed the maximum savings limit of $1,000,000. Current: $${goal.currentAmount}`
      });
    }

    goal.currentAmount = Math.round(newTotal * 100) / 100;

    const wasCompleted = goal.isCompleted;
    if (goal.currentAmount >= goal.targetAmount) {
      goal.isCompleted = true;
    }

    await goal.save();

    const celebrationMessage =
      !wasCompleted && goal.isCompleted
        ? `🎉 Congratulations! Goal "${goal.title}" has been successfully completed!`
        : `Successfully added $${parsedAmount} to "${goal.title}".`;

    return res.status(200).json({
      success: true,
      message: celebrationMessage,
      justCompleted: !wasCompleted && goal.isCompleted,
      data: goal
    });
  } catch (error) {
    console.error('Error in addFunds:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while adding funds',
      error: error.message
    });
  }
};

/**
 * @desc    Delete a savings goal
 * @route   DELETE /api/goals/:id
 * @access  Private
 */
const deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid goal ID format'
      });
    }

    const goal = await Goal.findOne({
      _id: id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: `Goal not found or not authorized with ID: ${id}`
      });
    }

    const goalTitle = goal.title;
    await Goal.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: `Goal "${goalTitle}" was deleted successfully.`,
      data: { id }
    });
  } catch (error) {
    console.error('Error in deleteGoal:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting goal',
      error: error.message
    });
  }
};

module.exports = {
  getGoals,
  getGoalsSummary,
  createGoal,
  updateGoal,
  addFunds,
  deleteGoal
};
