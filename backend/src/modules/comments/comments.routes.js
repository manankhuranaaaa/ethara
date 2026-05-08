const express = require('express');
const { body, param } = require('express-validator');
const commentsController = require('./comments.controller');
const { authenticate } = require('../../middleware/authenticate');
const validate = require('../../middleware/validate');

const taskCommentRouter = express.Router({ mergeParams: true });
const commentRouter = express.Router();

taskCommentRouter.use(authenticate);
commentRouter.use(authenticate);

taskCommentRouter.post(
  '/',
  [
    param('id').isUUID(),
    body('content').trim().notEmpty().withMessage('Comment content required'),
  ],
  validate,
  commentsController.addComment
);

commentRouter.patch(
  '/:id',
  [
    param('id').isUUID(),
    body('content').trim().notEmpty().withMessage('Comment content required'),
  ],
  validate,
  commentsController.editComment
);

commentRouter.delete('/:id', [param('id').isUUID()], validate, commentsController.deleteComment);

module.exports = { taskCommentRouter, commentRouter };
