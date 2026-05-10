export const EmptyState = ({ icon = '📭', title, description, action }) => (
  <div className="text-center py-16">
    <div className="text-4xl mb-3">{icon}</div>
    <h3 className="text-base font-medium text-gray-900 mb-1">{title}</h3>
    {description && <p className="text-sm text-gray-500 mb-4">{description}</p>}
    {action}
  </div>
);
