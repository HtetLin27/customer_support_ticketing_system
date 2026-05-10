// server/src/services/email.templates.js

// ── Base layout — wraps every email in consistent branding ────────────────────
const baseLayout = ({ title, previewText, body }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <!--[if mso]><style>table { border-collapse: collapse; }</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">

  <!-- Preview text (shown in inbox before opening) -->
  <span style="display:none;max-height:0;overflow:hidden;">${previewText}</span>

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">

      <!-- Email card -->
      <table width="600" cellpadding="0" cellspacing="0"
        style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

        <!-- Header -->
        <tr>
          <td style="background:#1d4ed8;padding:24px 32px;">
            <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;">
              🎫 Ticketing Support
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${body}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
              This email was sent by Ticketing Support System.<br>
              Please do not reply to this email.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ── Reusable component — action button ────────────────────────────────────────
const actionButton = (text, url) => `
  <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="background:#1d4ed8;border-radius:6px;">
        <a href="${url}"
           style="display:inline-block;padding:12px 24px;color:#ffffff;
                  text-decoration:none;font-size:14px;font-weight:500;">
          ${text}
        </a>
      </td>
    </tr>
  </table>`;

// ── Reusable component — info row ─────────────────────────────────────────────
const infoRow = (label, value) => `
  <tr>
    <td style="padding:6px 0;color:#6b7280;font-size:13px;width:120px;">${label}</td>
    <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:500;">${value}</td>
  </tr>`;

// ── Status badge ──────────────────────────────────────────────────────────────
const statusColors = {
  open: { bg: '#dbeafe', color: '#1e40af' },
  assigned: { bg: '#fef3c7', color: '#92400e' },
  in_progress: { bg: '#ede9fe', color: '#4c1d95' },
  resolved: { bg: '#d1fae5', color: '#065f46' },
  closed: { bg: '#f3f4f6', color: '#374151' },
};

const statusBadge = (status) => {
  const { bg, color } = statusColors[status] || statusColors.open;
  return `<span style="background:${bg};color:${color};padding:2px 10px;
    border-radius:20px;font-size:12px;font-weight:500;">
    ${status.replace('_', ' ').toUpperCase()}
  </span>`;
};

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 1 — Ticket created (sent to customer)
// ─────────────────────────────────────────────────────────────────────────────
const ticketCreatedTemplate = ({ customer, ticket, ticketUrl }) =>
  baseLayout({
    title: `Ticket #${ticket.id.slice(0, 8)} Created`,
    previewText: `Your support ticket has been received — we'll be in touch soon.`,
    body: `
      <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">
        Your ticket has been received ✓
      </h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
        Hi ${customer.name}, we've received your support request and our team
        will get back to you as soon as possible.
      </p>

      <div style="background:#f9fafb;border-radius:6px;padding:16px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('Ticket ID', `#${ticket.id.slice(0, 8).toUpperCase()}`)}
          ${infoRow('Subject', ticket.title)}
          ${infoRow('Priority', ticket.priority.toUpperCase())}
          ${infoRow('Status', statusBadge(ticket.status))}
          ${infoRow('Opened', new Date(ticket.created_at).toLocaleString())}
        </table>
      </div>

      ${actionButton('View Your Ticket', ticketUrl)}

      <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
        You can track the progress of your ticket and reply to our team
        by clicking the button above.
      </p>
    `,
  });

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 2 — Ticket assigned (sent to agent)
// ─────────────────────────────────────────────────────────────────────────────
const ticketAssignedTemplate = ({ agent, ticket, customer, ticketUrl }) =>
  baseLayout({
    title: `New Ticket Assigned — #${ticket.id.slice(0, 8)}`,
    previewText: `A new support ticket has been assigned to you.`,
    body: `
      <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">
        New ticket assigned to you
      </h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
        Hi ${agent.name}, a support ticket has been assigned to you.
        Please review and respond as soon as possible.
      </p>

      <div style="background:#f9fafb;border-radius:6px;padding:16px;margin-bottom:16px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('Ticket ID', `#${ticket.id.slice(0, 8).toUpperCase()}`)}
          ${infoRow('Subject', ticket.title)}
          ${infoRow('Priority', ticket.priority.toUpperCase())}
          ${infoRow('Customer', customer.name)}
          ${infoRow('Opened', new Date(ticket.created_at).toLocaleString())}
        </table>
      </div>

      <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;
                  padding:12px 16px;margin-bottom:24px;">
        <p style="margin:0;color:#92400e;font-size:13px;">
          <strong>Customer's message:</strong><br>
          ${ticket.description}
        </p>
      </div>

      ${actionButton('Open Ticket', ticketUrl)}
    `,
  });

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 3 — Status changed (sent to customer)
// ─────────────────────────────────────────────────────────────────────────────
const statusChangedTemplate = ({ customer, ticket, previousStatus, newStatus, ticketUrl }) =>
  baseLayout({
    title: `Ticket Update — #${ticket.id.slice(0, 8)}`,
    previewText: `Your ticket status has been updated to ${newStatus}.`,
    body: `
      <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">
        Your ticket has been updated
      </h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
        Hi ${customer.name}, the status of your support ticket has changed.
      </p>

      <div style="background:#f9fafb;border-radius:6px;padding:16px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('Ticket', ticket.title)}
          ${infoRow('Previous status', statusBadge(previousStatus))}
          ${infoRow('New status', statusBadge(newStatus))}
        </table>
      </div>

      ${
        newStatus === 'resolved'
          ? `
        <div style="background:#d1fae5;border-radius:6px;padding:16px;margin-bottom:24px;">
          <p style="margin:0;color:#065f46;font-size:14px;line-height:1.6;">
            ✅ <strong>Your issue has been resolved.</strong><br>
            If you're satisfied with the resolution, you can close the ticket.
            If the issue persists, simply reply and we'll reopen it.
          </p>
        </div>`
          : ''
      }

      ${actionButton('View Ticket', ticketUrl)}
    `,
  });

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 4 — New comment (sent to the other party)
// ─────────────────────────────────────────────────────────────────────────────
const newCommentTemplate = ({ recipient, commenter, comment, ticket, ticketUrl }) =>
  baseLayout({
    title: `New Reply — #${ticket.id.slice(0, 8)}`,
    previewText: `${commenter.name} replied to your support ticket.`,
    body: `
      <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">
        New reply on your ticket
      </h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
        Hi ${recipient.name}, ${commenter.name} has replied to ticket
        <strong>${ticket.title}</strong>.
      </p>

      <div style="border-left:3px solid #1d4ed8;padding:12px 16px;
                  background:#eff6ff;border-radius:0 6px 6px 0;margin-bottom:24px;">
        <p style="margin:0 0 4px;color:#1e40af;font-size:12px;font-weight:500;">
          ${commenter.name} · ${commenter.role}
        </p>
        <p style="margin:0;color:#1e3a8a;font-size:14px;line-height:1.6;">
          ${comment.body}
        </p>
      </div>

      ${actionButton('Reply to Ticket', ticketUrl)}
    `,
  });

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 5 — New ticket alert (sent to admins)
// ─────────────────────────────────────────────────────────────────────────────
const newTicketAdminTemplate = ({ ticket, customer, adminUrl }) =>
  baseLayout({
    title: `New Ticket — ${ticket.priority.toUpperCase()} Priority`,
    previewText: `${customer.name} opened a new ${ticket.priority} priority ticket.`,
    body: `
      <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">
        New support ticket opened
      </h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">
        A new ticket requires assignment.
      </p>

      <div style="background:#f9fafb;border-radius:6px;padding:16px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('From', customer.name)}
          ${infoRow('Email', customer.email)}
          ${infoRow('Subject', ticket.title)}
          ${infoRow('Priority', ticket.priority.toUpperCase())}
        </table>
      </div>

      ${actionButton('Assign Ticket', adminUrl)}
    `,
  });

module.exports = {
  ticketCreatedTemplate,
  ticketAssignedTemplate,
  statusChangedTemplate,
  newCommentTemplate,
  newTicketAdminTemplate,
};
