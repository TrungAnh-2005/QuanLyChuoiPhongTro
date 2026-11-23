import { useCallback, useRef, useState } from 'react';

const labels = {
  submitRoomRequest: ['Đang gửi yêu cầu…', 'Đã gửi yêu cầu, chờ quản lý xét duyệt'],
  approveRoomRequest: ['Đang phê duyệt yêu cầu…', 'Đã phê duyệt yêu cầu'],
  rejectRoomRequest: ['Đang từ chối yêu cầu…', 'Đã từ chối yêu cầu'],
  submitRoommateRequest: ['Đang gửi đăng ký ở ghép…', 'Đã gửi đăng ký ở ghép'],
  reviewRoommateRequest: ['Đang xử lý yêu cầu ở ghép…', 'Đã xử lý yêu cầu ở ghép'],
};

export default function useMutationFeedback(scope) {
  const [feedback, setFeedback] = useState({ scope, rows: [] });
  const sequence = useRef(0);
  if (feedback.scope !== scope) setFeedback({ scope, rows: [] });
  const notifications = feedback.scope === scope ? feedback.rows : [];
  const dismiss = useCallback(id => setFeedback(current => ({ ...current, rows: current.rows.filter(row => row.id !== id) })), []);
  const run = async (name, operation) => {
    const id = ++sequence.current;
    const [pending, success] = labels[name] || ['Đang xử lý yêu cầu…', 'Thao tác thành công'];
    setFeedback(current => ({ scope, rows: [{ id, state: 'pending', message: pending }, ...(current.scope === scope ? current.rows : [])] }));
    const finish = (state, message) => {
      setFeedback(current => current.scope !== scope ? current : { ...current,
        rows: current.rows.map(row => row.id === id ? { ...row, state, message } : row) });
    };
    try {
      const result = await operation();
      if (result?.success === false) throw new Error(result.error || result.message || 'Yêu cầu không thành công');
      finish('success', success);
      return result;
    } catch (error) {
      finish('error', error.message || 'Không thể hoàn tất yêu cầu. Vui lòng thử lại.');
      throw error;
    }
  };
  return { notifications, dismiss, run };
}
