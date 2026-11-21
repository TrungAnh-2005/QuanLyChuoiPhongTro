import { getRoomImage } from '../room.presentation.js';
import { Users } from 'lucide-react';
import { Edit3 } from 'lucide-react';
import { isRoomLocked } from '../room.rules.js';
import { Unlock } from 'lucide-react';
import { Lock } from 'lucide-react';
import { Trash2 } from 'lucide-react';

export default function RoomCard({ handleDeleteRoom, handleToggleRoomLock, occupantsCount, occupied, room, setEditingRoom, setRoomFormData, setSelectedRoomForMembers }) {
  return (<div
                      key={room.id}
                      className="bento-card p-5 bg-white border border-slate-200/80 rounded-2xl flex flex-col justify-between hover:shadow-lg transition-all"
                    >
                      <div>
                        {/* Ảnh phòng & badge */}
                        <div className="relative h-36 -mx-5 -mt-5 mb-3 overflow-hidden rounded-t-2xl bg-slate-100">
                          <img
                            src={room.image || getRoomImage(room)}
                            alt={`Phòng ${room.number}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2.5 right-2.5">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full text-white backdrop-blur-md shadow-xs ${
                              room.status === 'AVAILABLE'
                                ? 'bg-emerald-600/90'
                                : room.status === 'OCCUPIED'
                                ? 'bg-purple-600/90'
                                : room.status === 'HOLDING'
                                ? 'bg-amber-600/90'
                                : 'bg-slate-700/90'
                            }`}>
                              {room.status === 'AVAILABLE'
                                ? '🟢 Còn trống'
                                : room.status === 'OCCUPIED'
                                ? '🟣 Đang thuê'
                                : room.status === 'HOLDING'
                                ? '🔒 Giữ chỗ'
                                : room.status === 'LOCKED' ? 'Tạm khóa' : 'Bảo trì'}
                            </span>
                          </div>

                          <div className="absolute bottom-2 left-3 text-white text-[10px] font-bold bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs">
                            {room.houseCode} • {room.area} m²
                          </div>
                        </div>

                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-black text-slate-900">{room.number}</h3>
                            <p className="text-xs text-slate-500 font-medium">{room.house || room.houseCode}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-black text-purple-700">
                              {(room.price || 0).toLocaleString('vi-VN')} đ
                            </div>
                            <div className="text-[10px] text-slate-400">/ tháng</div>
                          </div>
                        </div>

                        {/* Người ở trong phòng */}
                        <div className="mt-3 p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-500 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>Người ở:</span>
                          </span>
                          <span className="font-bold text-slate-800">
                            {occupantsCount} / {room.maxOccupants || 2} người
                          </span>
                        </div>
                      </div>

                      {/* Thao tác */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5 text-xs">
                        <button
                          type="button"
                          onClick={() => setSelectedRoomForMembers(room)}
                          className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
                          title="Hồ sơ người ở"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Hồ sơ</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingRoom(room);
                            setRoomFormData({ ...room });
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                          title="Sửa phòng"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleRoomLock(room)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          disabled={!isRoomLocked(room) && occupied}
                          aria-label={isRoomLocked(room) ? 'Mở khóa phòng' : 'Tạm khóa phòng'}
                          title={isRoomLocked(room) ? 'Mở khóa phòng' : occupied ? 'Phòng còn người thuê, cần trả phòng trước khi khóa' : 'Tạm khóa phòng'}
                        >
                          {isRoomLocked(room) ? <Unlock className="w-3.5 h-3.5 text-emerald-600" /> : <Lock className="w-3.5 h-3.5 text-amber-600" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteRoom(room.id, room.number)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition cursor-pointer"
                          title="Xóa phòng"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>);
}
