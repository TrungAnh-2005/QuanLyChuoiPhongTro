// Commands consume current state through the app's composition boundary.
export function createLandlordsCommands({ find, request, view }) {
  return {
createLandlord: input => request('post','/auth/accounts',{...input,role:'STAFF'}),
toggleLandlordLock: id => request('patch',`/auth/accounts/${id}`,{status:find(view.landlords,id).isLocked ? 'ACTIVE':'LOCKED'}),
resetLandlordPassword: (id,password) => request('post',`/auth/accounts/${id}/reset-password`,{password}),
verifyLandlordKyc: (id,approved,reason='') => request('patch',`/auth/profiles/${id}`,{kycStatus:approved ? 'VERIFIED':'REJECTED',rejectionReason:reason})
};
}
