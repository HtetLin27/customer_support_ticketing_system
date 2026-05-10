// ─── State definitions ────────────────────────────────────────────────────────
// Each state knows:
//   label       → human-readable display name
//   terminal    → if true, no transitions out are possible
//   allowedBy   → which roles can SET this status
//   transitions → which statuses this state can move TO

const STATES = {
  open: {
    label: 'Open',
    terminal: false,
    allowedBy: ['admin'], // only admin can manually set to open (reopening)
    transitions: ['assigned'], // forward path
  },
  assigned: {
    label: 'Assigned',
    terminal: false,
    allowedBy: ['admin'],
    transitions: ['in_progress', 'open'],
  },
  in_progress: {
    label: 'In Progress',
    terminal: false,
    allowedBy: ['agent', 'admin'],
    transitions: ['resolved', 'assigned'],
  },
  resolved: {
    label: 'Resolved',
    terminal: false,
    allowedBy: ['agent', 'admin'],
    transitions: ['closed', 'open'], // open = customer reopen
  },
  closed: {
    label: 'Closed',
    terminal: true, // no way out — ever
    allowedBy: ['customer', 'admin'],
    transitions: [],
  },
};

// ─── Validate a transition ────────────────────────────────────────────────────
// Returns { valid: true } or { valid: false, reason: '...' }

const validateTransition = (currentStatus, nextStatus, userRole) => {
  // 1. Does the current state exist?
  const currentState = STATES[currentStatus];
  if (!currentState) {
    return { valid: false, reason: `Unknown current status: ${currentStatus}` };
  }

  // 2. Is the current state terminal?
  if (currentState.terminal) {
    return {
      valid: false,
      reason: `Ticket is closed. Closed tickets cannot be changed.`,
    };
  }

  // 3. Is the target status a valid state?
  if (!STATES[nextStatus]) {
    return { valid: false, reason: `Unknown target status: ${nextStatus}` };
  }

  // 4. Is this transition in the allowed list?
  if (!currentState.transitions.includes(nextStatus)) {
    return {
      valid: false,
      reason: `Cannot move from "${currentStatus}" to "${nextStatus}"`,
      allowed: currentState.transitions,
    };
  }

  // 5. Is this role allowed to set the target status?
  const targetState = STATES[nextStatus];
  if (!targetState.allowedBy.includes(userRole)) {
    return {
      valid: false,
      reason: `Role "${userRole}" cannot set status to "${nextStatus}"`,
    };
  }

  return { valid: true };
};

// ─── Get allowed transitions for a user ───────────────────────────────────────
// Used by the frontend to know which options to show in the status dropdown

const getAllowedTransitions = (currentStatus, userRole) => {
  const state = STATES[currentStatus];
  if (!state || state.terminal) return [];

  // Filter transitions to only those this role can trigger
  return state.transitions.filter((next) => STATES[next].allowedBy.includes(userRole));
};

// ─── Get all state labels — for frontend display ───────────────────────────────
const getStateLabels = () =>
  Object.entries(STATES).reduce((acc, [key, val]) => {
    acc[key] = val.label;
    return acc;
  }, {});

module.exports = { STATES, validateTransition, getAllowedTransitions, getStateLabels };
