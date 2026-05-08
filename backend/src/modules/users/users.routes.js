const express = require('express');
const { body, param } = require('express-validator');
const usersController = require('./users.controller');
const { authenticate, authorize } = require('../../middleware/authenticate');
const validate = require('../../middleware/validate');

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/', usersController.listUsers);

router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid user ID')],
  validate,
  usersController.getUserById
);

router.patch(
  '/:id/role',
  [
    param('id').isUUID().withMessage('Invalid user ID'),
    body('role').isIn(['admin', 'member']).withMessage('Role must be admin or member'),
  ],
  validate,
  usersController.updateUserRole
);

router.delete(
  '/:id',
  [param('id').isUUID().withMessage('Invalid user ID')],
  validate,
  usersController.deactivateUser
);

module.exports = router;
