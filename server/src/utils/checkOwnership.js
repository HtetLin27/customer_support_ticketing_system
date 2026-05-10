// Rules:
//   admin  → always allowed, no ownership check needed
//   agent  → allowed only if ticket.assigned_to === their id
//   customer → allowed only if ticket.created_by === their id

const canActOnTicket = (reqUser, ticket) => {
  if (reqUser.role === 'admin') return true; // Admins can do anything

  if (reqUser.role === 'agent') {
    return ticket.assigned_to === reqUser.id; // Agents can only act on tickets assigned to them
  }

  if (reqUser.role === 'customer') {
    return ticket.created_by === reqUser.id; // Customers can only act on tickets they created
  }

  return false; // Default deny
};

// Generic version — checks if a resource belongs to the requesting user
// Used for things like "can this user edit their own comment?"
const isOwner = (reqUser, resourceOwnerId) => {
  if (reqUser.role === 'admin') return true; // Admins can do anything

  return reqUser.id === resourceOwnerId; // Otherwise, check ownership
};

module.exports = { canActOnTicket, isOwner };
