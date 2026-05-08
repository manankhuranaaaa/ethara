const express = require('express');
const { body, param, query } = require('express-validator');
const tasksController = require('./tasks.controller');
const { authenticate } = require('../../middleware/authenticate');
const { isProjectMember, isProjectAdmin } = require('../../middleware/rbac');
const validate = require('../../middleware/validate');

const router = express.Router({ mergeParams: true });

router.use(authenticate);

const taskValidators = [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),
  body('description').optional().trim(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('status').optional().isIn(['todo', 'in_progress', 'in_review', 'done']),
  body('assignee_id').optional({ nullable: true }).isUUID(),
  body('due_date').optional({ nullable: true }).isDate().withMessage('Invalid date'),
];

// Project-scoped routes
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['todo', 'in_progress', 'in_review', 'done']),
    query('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    query('assignee_id').optional().isUUID(),
  ],
  validate,
  isProjectMember,
  tasksController.listTasks
);

router.post('/', taskValidators, validate, isProjectMember, tasksController.createTask);

module.exports = router;
