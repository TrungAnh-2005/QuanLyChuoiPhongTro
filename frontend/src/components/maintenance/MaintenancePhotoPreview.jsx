import { X } from 'lucide-react';

export default function MaintenancePhotoPreview({ photo, onClose }) {
  if (!photo) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
    >
      <div className="relative max-w-xl max-h-[85vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl p-2">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        <img src={photo} alt="Ảnh sự cố" className="w-full h-auto rounded-xl object-contain max-h-[80vh]" />
      </div>
    </div>
  );
}
