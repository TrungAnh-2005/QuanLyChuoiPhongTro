const sameId = (left, right) => left != null && right != null && String(left) === String(right);

export function findRoommateSponsor(contracts, members, request) {
  return contracts.find(contract => contract.status === 'ACTIVE'
    && sameId(contract.roomId, request.roomId)
    && (sameId(contract.tenantId, request.requestedByTenantId)
      || members.some(member => member.status === 'ACTIVE'
        && sameId(member.roomId, request.roomId)
        && sameId(member.contractId, contract.id)
        && sameId(member.tenantId, request.requestedByTenantId))));
}

export const missingSponsorMessage = 'Người gửi chưa có hợp đồng thuê còn hiệu lực tại phòng này. Hãy kiểm tra đơn thuê / đặt cọc và hợp đồng trước khi duyệt ở ghép.';
