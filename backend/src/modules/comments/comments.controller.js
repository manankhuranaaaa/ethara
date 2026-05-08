const commentsService = require('./comments.service');
const { sendSuccess, sendCreated } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

const addComment = asyncHandler(async (req, res) => {
  const comment = await commentsService.addComment(req.params.id, req.body.content, req.user.id);
  return sendCreated(res, comment, 'Comment added');
});

const editComment = asyncHandler(async (req, res) => {
  const comment = await commentsService.editComment(req.params.id, req.body.content, req.user.id);
  return sendSuccess(res, comment, 'Comment updated');
});

const deleteComment = asyncHandler(async (req, res) => {
  await commentsService.deleteComment(req.params.id, req.user.id, req.user.role);
  return sendSuccess(res, null, 'Comment deleted');
});

module.exports = { addComment, editComment, deleteComment };
