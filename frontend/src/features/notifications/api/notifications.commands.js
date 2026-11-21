// Commands consume current state through the app's composition boundary.
export function createNotificationsCommands({ request }) {
  return {
markNotificationRead: id => request('patch',`/notifications/${id}/read`,{}),
markAllNotificationsRead: () => request('patch','/notifications/read-all',{})
};
}
