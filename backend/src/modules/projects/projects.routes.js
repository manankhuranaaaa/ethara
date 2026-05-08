const express = require('express');
const { body, param, query } = require('express-validator');
const projectsController = require('./projects.controller');
const { authenticate } = require('../../middleware/authenticate');
const { isProjectMember, isProjectAdmin } = require('../../middleware/rbac');
const validate = require('../../middleware/validate');

const router = express.Router();

router.use(authenticate);

const projectValidators = [
  body('name').trim().isLength({ min: 2, max: 200 }).withMessage('Name must be 2–200 characters'),
  body('description').optional().trim(),
  body('due_date').optional({ nullable: true }).isDate().withMessage('Invalid date format'),
];

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['active', 'archived', 'completed']),
  ],
  validate,
  projectsController.listProjects
);

router.post('/', projectValidators, validate, projectsController.createProject);

router.get('/:id', [param('id').isUUID()], validate, isProjectMember, projectsController.getProjectById);

router.patch(
  '/:id',
  [
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 2, max: 200 }),
    body('status').optional().isIn(['active', 'archived', 'completed']),
    body('due_date').optional({ nullable: true }).isDate(),
  ],
  validate,
  isProjectAdmin,
  projectsController.updateProject
);

router.delete('/:id', [param('id').isUUID()], validate, isProjectAdmin, projectsController.archiveProject);

router.get('/:id/members', [param('id').isUUID()], validate, isProjectMember, projectsController.getMembers);

router.post(
  '/:id/members',
  [
    param('id').isUUID(),
    body('userId').optional().isUUID().withMessage('Valid user ID required'),
    body('email').optional().isEmail().withMessage('Valid email required'),
    body('role').optional().isIn(['admin', 'member']),
  ],
  validate,
  isProjectAdmin,
  projectsController.addMember
);

router.delete(
  '/:id/members/:userId',
  [param('id').isUUID(), param('userId').isUUID()],
  validate,
  isProjectAdmin,
  projectsController.removeMember
);

module.exports = router;
