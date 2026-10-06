import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  Save,
  CheckCircle2,
  X,
  Building2,
  Zap,
  Droplets,
  Wifi,
  Trash2,
  Bike,
  Sparkles
} from 'lucide-react';
import Modal from '../common/Modal';
import { useData } from '../../contexts/DataContext';

export default function HouseServiceConfigModal({ isOpen, onClose, houseCode, houseName }) {
  const { houseServiceConfigs, updateHouseServiceConfig, addHouseServiceConfig } = useData();

  const [activeHouseCode, setActiveHouseCode] = useState(houseCode || 'CS-01');
  const [editingValues, setEditingValues] = useState({});
  const [saveToast, setSaveToast] = useState(null);

  // New service form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newCalcType, setNewCalcType] = useState('METER');
  const [newUnitPrice, setNewUnitPrice] = useState('');

  const currentConfigs = houseServiceConfigs.filter(
    (c) => c.houseCode === (activeHouseCode || houseCode || 'CS-01')
  );

  const handlePriceChange = (configId, value) => {
    setEditingValues((prev) => ({
      ...prev,
      [configId]: value.replace(/\D/g, '')
    }));
  };

  const handleSaveConfig = (config) => {
    const newPrice = editingValues[config.id] !== undefined
      ? Number(editingValues[config.id])
      : config.unitPrice;

    updateHouseServiceConfig(config.id, newPrice, config.calculationType);
    setSaveToast(`Đã lưu đơn giá mới cho dịch vụ "${config.serviceName}": ${newPrice.toLocaleString('vi-VN')} đ`);
    setTimeout(() => setSaveToast(null), 3500);
  };

  const handleAddNewService = (e) => {
    e.preventDefault();
    if (!newServiceName || !newUnitPrice) return;

    addHouseServiceConfig({
      boardingHouseId: activeHouseCode === 'CS-01' ? 1 : activeHouseCode === 'CS-02' ? 2 : 3,
      houseCode: activeHouseCode,
      serviceName: newServiceName,
      calculationType: newCalcType,
      unitPrice: Number(newUnitPrice)
    });

    setNewServiceName('');
    setNewUnitPrice('');
    setShowAddForm(false);
    setSaveToast(`Đã bổ sung dịch vụ mới "${newServiceName}" vào cơ sở ${activeHouseCode}`);
    setTimeout(() => setSaveToast(null), 3500);
  };

  const getServiceIcon = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('điện')) return <Zap className="w-4 h-4 text-amber-500" />;
    if (lower.includes('nước')) return <Droplets className="w-4 h-4 text-blue-500" />;
    if (lower.includes('wifi') || lower.includes('internet')) return <Wifi className="w-4 h-4 text-indigo-500" />;
    if (lower.includes('rác') || lower.includes('vệ sinh')) return <Trash2 className="w-4 h-4 text-emerald-500" />;
    if (lower.includes('xe')) return <Bike className="w-4 h-4 text-purple-500" />;
    return <Sparkles className="w-4 h-4 text-slate-500" />;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <span>Cài Đặt Biểu Giá Dịch Vụ Chi Nhánh (UC-S01B)</span>
                <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-xs font-bold font-mono">
                  house_service_configs
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Đơn giá được áp dụng tự động khi chốt công tơ và xuất hóa đơn hàng tháng cho cơ sở
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Facility Selector Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          {[
            { code: 'CS-01', name: 'Cơ Sở 1 - Cầu Giấy' },
            { code: 'CS-02', name: 'Cơ Sở 2 - Bách Khoa' },
            { code: 'CS-03', name: 'Cơ Sở 3 - Đống Đa' }
          ].map((h) => (
            <button
              key={h.code}
              type="button"
              onClick={() => setActiveHouseCode(h.code)}
              className={`flex-1 py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                activeHouseCode === h.code
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {h.name}
            </button>
          ))}
        </div>

        {/* Toast Save Alert */}
        {saveToast && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveToast}</span>
          </div>
        )}

        {/* Services List Table */}
        <div className="space-y-2.5">
          {currentConfigs.map((cfg) => {
            const currentInputValue = editingValues[cfg.id] !== undefined
              ? editingValues[cfg.id]
              : String(cfg.unitPrice);

            return (
              <div
                key={cfg.id}
                className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                    {getServiceIcon(cfg.serviceName)}
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <span>{cfg.serviceName}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-slate-500 text-[11px]">
                      <span>Kiểu tính:</span>
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                        {cfg.calculationType === 'METER'
                          ? 'METER (Theo chỉ số công tơ)'
                          : cfg.calculationType === 'PER_CAPITA'
                          ? 'PER_CAPITA (Theo đầu người)'
                          : 'PER_ROOM (Cố định/phòng)'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:justify-end">
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={Number(currentInputValue).toLocaleString('vi-VN')}
                      onChange={(e) => handlePriceChange(cfg.id, e.target.value)}
                      className="w-32 px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-right text-purple-700 text-xs focus:outline-none focus:border-purple-500"
                    />
                    <span className="text-[10px] text-slate-400 font-bold ml-1">VNĐ</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSaveConfig(cfg)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                    title="Lưu đơn giá mới cho cơ sở này"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Service Section */}
        {!showAddForm ? (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="w-full py-2.5 bg-slate-50 hover:bg-purple-50 hover:text-purple-700 text-slate-700 font-bold text-xs rounded-xl border border-dashed border-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Dịch Vụ Mới Cho Cơ Sở Này</span>
          </button>
        ) : (
          <form onSubmit={handleAddNewService} className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-3 text-xs">
            <div className="font-bold text-purple-950 flex items-center justify-between">
              <span>Thêm loại dịch vụ mới:</span>
              <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên dịch vụ *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Phí gửi ô tô"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phương thức tính *</label>
                <select
                  value={newCalcType}
                  onChange={(e) => setNewCalcType(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                >
                  <option value="METER">METER (Theo đồng hồ đo)</option>
                  <option value="PER_CAPITA">PER_CAPITA (Theo đầu người)</option>
                  <option value="PER_ROOM">PER_ROOM (Cố định theo phòng)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Đơn giá (VNĐ) *</label>
                <input
                  type="number"
                  required
                  placeholder="Ví dụ: 800000"
                  value={newUnitPrice}
                  onChange={(e) => setNewUnitPrice(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 font-bold rounded-lg"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-purple-600 text-white font-bold rounded-lg shadow-xs hover:bg-purple-700"
              >
                Lưu Dịch Vụ Mới
              </button>
            </div>
          </form>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
          >
            Đóng Cài Đặt
          </button>
        </div>
      </div>
    </Modal>
  );
}
