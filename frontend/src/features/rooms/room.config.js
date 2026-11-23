export const ROOM_IMAGE_PRESETS = [
  { label: 'Phòng Studio Tiêu Chuẩn', url: '/assets/images/room_studio_1.jpg' },
  { label: 'Căn Duplex Gác Lửng', url: '/assets/images/room_duplex_2.jpg' },
  { label: 'Phòng Suite Ban Công Penthouse', url: '/assets/images/room_suite_3.jpg' },
  { label: 'Phòng Ngủ Tối Giản Hiện Đại', url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop' },
  { label: 'Phòng Full Nội Thất Cao Cấp', url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop' }
];

import { amenityNames } from './room.mapper.js';
export const ROOM_AMENITIES = ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Máy giặt',
  'Giường nệm', 'Tủ quần áo', 'Ban công', 'Bếp riêng', 'Gác lửng', 'Khóa FaceID', 'Thang máy'];

const normalized = value => value.normalize('NFD').replace(/[\u0300-\u036f\s]/g, '').toLowerCase().replace(/đ/g, 'd');

export const amenityOptions = values => {
  const saved = amenityNames(values);
  return [...new Set([...ROOM_AMENITIES.map(option => saved.find(name => normalized(name).includes(normalized(option))) || option), ...saved])];
};
