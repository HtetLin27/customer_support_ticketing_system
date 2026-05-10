// customer → only their own submitted tickets
// agent    → only tickets assigned to them
// admin    → everything (empty where = no filter)

const buildTicketScope = (reqUser) => {
  switch (reqUser.role) {
    case 'customer':
      return { created_by: reqUser.id };

    case 'agent':
      return { assigned_to: reqUser.id };

    case 'admin':
      return {}; // no filter — admin sees everything

    default:
      // Unknown role — return impossible condition so nothing is returned
      // Never silently return everything for an unknown role
      return { id: null };
  }
};

module.exports = { buildTicketScope };
