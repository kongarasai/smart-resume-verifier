const bcrypt = require('bcryptjs');

class MockDB {
  constructor() {
    this.users = new Map();
    this.nextId = 1;
  }

  async findUserByEmail(email) {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async createUser({ email, password_hash, full_name, role }) {
    const id = this.nextId++;
    const user = { id, email, password_hash, full_name, role, is_active: true, created_at: new Date() };
    this.users.set(id, user);
    return user;
  }

  async updateLastLogin(id) {
    const user = this.users.get(id);
    if (user) user.last_login = new Date();
  }

  async getUserById(id) {
    return this.users.get(id) || null;
  }
}

module.exports = new MockDB();
