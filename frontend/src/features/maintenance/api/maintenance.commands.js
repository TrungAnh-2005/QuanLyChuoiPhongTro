// Commands consume current state through the app's composition boundary.
export function createMaintenanceCommands({ request, room, tenantId }) {
  return {
createTicket: input => request('post', '/maintenance', { roomId: input.roomId || room(input.room).id, tenantId: tenantId(input), title: input.title || input.issue, description: input.description || input.issue, imageUrl: input.imageUrl, priority: input.priority || 'MEDIUM' }),
updateTicketStatus: (id, status, details={}) => request('put', `/maintenance/${id}/status`, { status, ...details })
};
}
