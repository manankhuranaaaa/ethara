'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const adminId = uuidv4();
const member1Id = uuidv4();
const member2Id = uuidv4();
const member3Id = uuidv4();
const project1Id = uuidv4();
const project2Id = uuidv4();

module.exports = {
  async up(queryInterface) {
    const passwordHash = await bcrypt.hash('Password123!', 12);
    const now = new Date();

    // Users
    await queryInterface.bulkInsert('users', [
      {
        id: adminId,
        name: 'Admin User',
        email: 'admin@taskmanager.com',
        password_hash: passwordHash,
        role: 'admin',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: member1Id,
        name: 'Alice Johnson',
        email: 'alice@taskmanager.com',
        password_hash: passwordHash,
        role: 'member',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: member2Id,
        name: 'Bob Smith',
        email: 'bob@taskmanager.com',
        password_hash: passwordHash,
        role: 'member',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: member3Id,
        name: 'Carol White',
        email: 'carol@taskmanager.com',
        password_hash: passwordHash,
        role: 'member',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);

    // Projects
    await queryInterface.bulkInsert('projects', [
      {
        id: project1Id,
        name: 'Website Redesign',
        description: 'Complete overhaul of the company website with modern design.',
        owner_id: adminId,
        status: 'active',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        created_at: now,
        updated_at: now,
      },
      {
        id: project2Id,
        name: 'Mobile App MVP',
        description: 'Build the minimum viable product for the mobile application.',
        owner_id: member1Id,
        status: 'active',
        due_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        created_at: now,
        updated_at: now,
      },
    ]);

    // Project Members
    await queryInterface.bulkInsert('project_members', [
      { id: uuidv4(), project_id: project1Id, user_id: adminId, role: 'admin', joined_at: now },
      { id: uuidv4(), project_id: project1Id, user_id: member1Id, role: 'member', joined_at: now },
      { id: uuidv4(), project_id: project1Id, user_id: member2Id, role: 'member', joined_at: now },
      { id: uuidv4(), project_id: project2Id, user_id: member1Id, role: 'admin', joined_at: now },
      { id: uuidv4(), project_id: project2Id, user_id: member2Id, role: 'member', joined_at: now },
      { id: uuidv4(), project_id: project2Id, user_id: member3Id, role: 'member', joined_at: now },
    ]);

    // Tasks
    const tasks = [
      {
        id: uuidv4(),
        title: 'Design new homepage mockup',
        description: 'Create wireframes and high-fidelity mockups for the new homepage.',
        project_id: project1Id,
        assignee_id: member1Id,
        created_by: adminId,
        status: 'in_progress',
        priority: 'high',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        is_overdue: false,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        title: 'Set up CI/CD pipeline',
        description: 'Configure GitHub Actions for automated testing and deployment.',
        project_id: project1Id,
        assignee_id: member2Id,
        created_by: adminId,
        status: 'todo',
        priority: 'critical',
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        is_overdue: false,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        title: 'Write unit tests for auth module',
        description: 'Achieve 80% code coverage for authentication endpoints.',
        project_id: project1Id,
        assignee_id: adminId,
        created_by: adminId,
        status: 'in_review',
        priority: 'medium',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        is_overdue: false,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        title: 'Update API documentation',
        description: 'Document all new endpoints in Swagger/OpenAPI format.',
        project_id: project1Id,
        assignee_id: member1Id,
        created_by: adminId,
        status: 'done',
        priority: 'low',
        due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        is_overdue: false,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        title: 'Fix login page responsiveness',
        description: 'The login page breaks on mobile screens below 375px.',
        project_id: project1Id,
        assignee_id: member2Id,
        created_by: member1Id,
        status: 'todo',
        priority: 'high',
        due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        is_overdue: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        title: 'Design app onboarding flow',
        description: 'Create user onboarding screens for first-time app users.',
        project_id: project2Id,
        assignee_id: member3Id,
        created_by: member1Id,
        status: 'in_progress',
        priority: 'high',
        due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        is_overdue: false,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        title: 'Implement push notifications',
        description: 'Integrate Firebase Cloud Messaging for push notifications.',
        project_id: project2Id,
        assignee_id: member2Id,
        created_by: member1Id,
        status: 'todo',
        priority: 'medium',
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        is_overdue: false,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        title: 'Set up analytics tracking',
        description: 'Integrate Mixpanel for user behavior analytics.',
        project_id: project2Id,
        assignee_id: member1Id,
        created_by: member1Id,
        status: 'todo',
        priority: 'low',
        due_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        is_overdue: false,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        title: 'Performance optimization audit',
        description: 'Run Lighthouse audit and fix all critical performance issues.',
        project_id: project2Id,
        assignee_id: member3Id,
        created_by: member1Id,
        status: 'in_review',
        priority: 'critical',
        due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        is_overdue: false,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        title: 'App store submission preparation',
        description: 'Prepare screenshots, descriptions, and metadata for App Store.',
        project_id: project2Id,
        assignee_id: member1Id,
        created_by: member1Id,
        status: 'done',
        priority: 'medium',
        due_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        is_overdue: false,
        created_at: now,
        updated_at: now,
      },
    ];

    await queryInterface.bulkInsert('tasks', tasks);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('tasks', null, {});
    await queryInterface.bulkDelete('project_members', null, {});
    await queryInterface.bulkDelete('projects', null, {});
    await queryInterface.bulkDelete('users', null, {});
  },
};
