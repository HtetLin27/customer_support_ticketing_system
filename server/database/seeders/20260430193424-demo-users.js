'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    const hash = await bcrypt.hash('password123', 10);

    await queryInterface.bulkInsert('users', [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Admin User',
        email: 'admin@ticketing.dev',
        password_hash: hash,
        role: 'admin',
        created_at: new Date(),
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Agent Alice',
        email: 'alice@ticketing.dev',
        password_hash: hash,
        role: 'agent',
        created_at: new Date(),
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        name: 'Customer Bob',
        email: 'bob@ticketing.dev',
        password_hash: hash,
        role: 'customer',
        created_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', null, {});
  },
};
