const express = require('express');
const { body, param } = require('express-validator');
const tasksController = require('./tasks.controller');
const { authenticate } = require('../../middleware/authenticate');
const validate = require('../../middleware/validate');
const asyncHandler = require('../../utils/asyncHandler');
const { ActivityLog, User } = require('../../models');
const { sendSuccess } = require('../../utils/response');

const router = express.Router();

router.use(authenticate);

router.get('/:id', [param('id').isUUID()], validate, tasksController.getTaskById);

router.get(
  '/:id/activity',
  [param('id').isUUID()],
  validate,
  asyncHandler(async (req, res) => {
    const logs = await ActivityLog.findAll({
      where: { entity_type: 'task', entity_id: req.params.id },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar_url'] }],
      order: [['created_at', 'DESC']],
      limit: 20,
    });
    return sendSuccess(res, logs);
  })
);

router.patch(
  '/:id',
  [
    param('id').isUUID(),
    body('title').optional().trim().isLength({ min: 3, max: 200 }),
    body('description').optional().trim(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('due_date').optional({ nullable: true }).isDate(),
    body('assignee_id').optional({ nullable: true }).isUUID(),
  ],
  validate,
  tasksController.updateTask
);

router.delete('/:id', [param('id').isUUID()], validate, tasksController.deleteTask);

router.patch(
  '/:id/status',
  [
    param('id').isUUID(),
    body('status').isIn(['todo', 'in_progress', 'in_review', 'done']).withMessage('Invalid status'),
  ],
  validate,
  tasksController.updateTaskStatus
);

router.patch(
  '/:id/assign',
  [
    param('id').isUUID(),
    body('assignee_id').optional({ nullable: true }).isUUID().withMessage('Invalid assignee ID'),
  ],
  validate,
  tasksController.assignTask
);

module.exports = router;
