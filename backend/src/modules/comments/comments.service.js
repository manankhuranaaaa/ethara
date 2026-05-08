const { TaskComment, Task, User } = require('../../models');
const { logActivity } = require('../../utils/activityLogger');

const addComment = async (taskId, content, userId) => {
  const task = await Task.findByPk(taskId);
  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  const comment = await TaskComment.create({ task_id: taskId, user_id: userId, content });
  await logActivity({ userId, entityType: 'task', entityId: taskId, action: 'comment_added', meta: { commentId: comment.id } });

  return TaskComment.findOne({
    where: { id: comment.id },
    include: [{ model: User, as: 'author', attributes: ['id', 'name', 'email', 'avatar_url'] }],
  });
};

const editComment = async (commentId, content, userId) => {
  const comment = await TaskComment.findByPk(commentId);
  if (!comment) {
    const error = new Error('Comment not found');
    error.statusCode = 404;
    throw error;
  }
  if (comment.user_id !== userId) {
    const error = new Error('You can only edit your own comments');
    error.statusCode = 403;
    throw error;
  }
  await comment.update({ content });
  return comment;
};

const deleteComment = async (commentId, userId, userRole) => {
  const comment = await TaskComment.findByPk(commentId);
  if (!comment) {
    const error = new Error('Comment not found');
    error.statusCode = 404;
    throw error;
  }
  if (comment.user_id !== userId && userRole !== 'admin') {
    const error = new Error('You can only delete your own comments');
    error.statusCode = 403;
    throw error;
  }
  await comment.destroy();
};

module.exports = { addComment, editComment, deleteComment };
