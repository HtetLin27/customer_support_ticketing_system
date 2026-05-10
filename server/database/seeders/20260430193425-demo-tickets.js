'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('tickets', [
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        title: 'Cannot log into my account',
        description: 'I keep getting invalid password error even after resetting.',
        status: 'open',
        priority: 'high',
        created_by: '33333333-3333-3333-3333-333333333333', // Bob
        assigned_to: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        title: 'Payment not processing',
        description: 'Credit card charge fails at checkout every time.',
        status: 'assigned',
        priority: 'urgent',
        created_by: '33333333-3333-3333-3333-333333333333', // Bob
        assigned_to: '22222222-2222-2222-2222-222222222222', // Alice
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('tickets', null, {});
  },
};
