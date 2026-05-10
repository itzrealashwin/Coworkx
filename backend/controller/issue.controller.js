import issueService from '../services/issue.service.js';

const createIssue = async (req, res, next) => {
  try {
    const issue = await issueService.createIssue({
      project: req.project,
      orgMember: req.orgMember,
      userId: req.user.id,
      body: req.body,
    });

    res.status(201).json({ success: true, issue });
  } catch (error) {
    next(error);
  }
};

const listIssues = async (req, res, next) => {
  try {
    const issues = await issueService.listIssues({
      project: req.project,
      org: req.org,
      orgMember: req.orgMember,
      userId: req.user.id,
      query: req.query,
    });

    res.status(200).json({ success: true, issues });
  } catch (error) {
    next(error);
  }
};

const getBacklog = async (req, res, next) => {
  try {
    const issues = await issueService.listBacklogIssues({
      project: req.project,
      orgMember: req.orgMember,
      userId: req.user.id,
    });

    res.status(200).json({ success: true, issues });
  } catch (error) {
    next(error);
  }
};

const moveBacklogIssues = async (req, res, next) => {
  try {
    const result = await issueService.moveBacklogIssues({
      project: req.project,
      orgMember: req.orgMember,
      userId: req.user.id,
      body: req.body,
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const createStatus = async (req, res, next) => {
  try {
    const status = await issueService.createIssueStatus({
      project: req.project,
      orgMember: req.orgMember,
      userId: req.user.id,
      body: req.body,
    });

    res.status(201).json({ success: true, status });
  } catch (error) {
    next(error);
  }
};

const listStatuses = async (req, res, next) => {
  try {
    const statuses = await issueService.listIssueStatuses({
      project: req.project,
      orgMember: req.orgMember,
      userId: req.user.id,
    });

    res.status(200).json({ success: true, statuses });
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const status = await issueService.updateIssueStatus({
      project: req.project,
      orgMember: req.orgMember,
      userId: req.user.id,
      statusId: req.params.statusId,
      body: req.body,
    });

    res.status(200).json({ success: true, status });
  } catch (error) {
    next(error);
  }
};

const deleteStatus = async (req, res, next) => {
  try {
    await issueService.deleteIssueStatus({
      project: req.project,
      orgMember: req.orgMember,
      userId: req.user.id,
      statusId: req.params.statusId,
    });

    res.status(200).json({ success: true, message: 'Status deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

const getIssue = async (req, res, next) => {
  try {
    const issue = await issueService.getIssueByNumber({
      project: req.project,
      orgMember: req.orgMember,
      userId: req.user.id,
      issueNumber: req.params.issueNumber,
    });

    res.status(200).json({ success: true, issue });
  } catch (error) {
    next(error);
  }
};

const updateIssue = async (req, res, next) => {
  try {
    const issue = await issueService.updateIssue({
      project: req.project,
      orgMember: req.orgMember,
      userId: req.user.id,
      issueNumber: req.params.issueNumber,
      body: req.body,
    });

    res.status(200).json({ success: true, issue });
  } catch (error) {
    next(error);
  }
};

const deleteIssue = async (req, res, next) => {
  try {
    await issueService.deleteIssue({
      project: req.project,
      orgMember: req.orgMember,
      userId: req.user.id,
      issueNumber: req.params.issueNumber,
    });

    res.status(200).json({ success: true, message: 'Issue deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

const addComment = async (req, res, next) => {
  try {
    const comment = await issueService.addIssueComment({
      project: req.project,
      orgMember: req.orgMember,
      userId: req.user.id,
      issueNumber: req.params.issueNumber,
      body: req.body,
    });

    res.status(201).json({ success: true, comment });
  } catch (error) {
    next(error);
  }
};

const updateComment = async (req, res, next) => {
  try {
    const comment = await issueService.updateIssueComment({
      project: req.project,
      orgMember: req.orgMember,
      userId: req.user.id,
      issueNumber: req.params.issueNumber,
      commentId: req.params.commentId,
      body: req.body,
    });

    res.status(200).json({ success: true, comment });
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    await issueService.deleteIssueComment({
      project: req.project,
      orgMember: req.orgMember,
      userId: req.user.id,
      issueNumber: req.params.issueNumber,
      commentId: req.params.commentId,
    });

    res.status(200).json({ success: true, message: 'Comment deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

const createLink = async (req, res, next) => {
  try {
    const link = await issueService.createIssueLink({
      project: req.project,
      orgMember: req.orgMember,
      userId: req.user.id,
      issueNumber: req.params.issueNumber,
      body: req.body,
    });

    res.status(201).json({ success: true, link });
  } catch (error) {
    next(error);
  }
};

const deleteLink = async (req, res, next) => {
  try {
    await issueService.deleteIssueLink({
      project: req.project,
      orgMember: req.orgMember,
      userId: req.user.id,
      issueNumber: req.params.issueNumber,
      linkId: req.params.linkId,
    });

    res.status(200).json({ success: true, message: 'Issue link removed successfully.' });
  } catch (error) {
    next(error);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const history = await issueService.getIssueHistory({
      project: req.project,
      orgMember: req.orgMember,
      userId: req.user.id,
      issueNumber: req.params.issueNumber,
    });

    res.status(200).json({ success: true, history });
  } catch (error) {
    next(error);
  }
};

export default {
  createIssue,
  listIssues,
  getBacklog,
  moveBacklogIssues,
  createStatus,
  listStatuses,
  updateStatus,
  deleteStatus,
  getIssue,
  updateIssue,
  deleteIssue,
  addComment,
  updateComment,
  deleteComment,
  createLink,
  deleteLink,
  getHistory,
};
