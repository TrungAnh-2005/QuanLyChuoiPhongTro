// Commands consume current state through the app's composition boundary.
export function createPropertiesCommands({ actions, api, create, find, patch, refreshData, remove, request, requireEmptyHouse, resources, view }) {
  return {
updateUtilityPrices: async prices => {
      for (const house of view.boardingHouses) for (const [serviceName,unitPrice] of [['Điện',prices.elecPrice],['Nước',prices.waterPrice]]) {
        const existing = view.houseServiceConfigs.find(c=>c.boardingHouseId===house.id && c.serviceName===serviceName);
        if(existing) await api.patch(`${resources.houseServiceConfigs}/${existing.id}`,{unitPrice:Number(unitPrice)});
        else await api.post(resources.houseServiceConfigs,{boardingHouseId:house.id,serviceName,calculationType:'METER',unitPrice:Number(unitPrice)});
      }
      await refreshData(); return {success:true};
    },
recordHouseDeletion: input => actions.addAuditLog({action:'DELETE_HOUSE',target:input.houseCode,details:input.houseName}),
addHouseServiceConfig: input => create('houseServiceConfigs', { boardingHouseId: input.boardingHouseId || find(view.boardingHouses,input.houseCode).id, serviceName: input.serviceName, calculationType: input.calculationType, unitPrice: Number(input.unitPrice) }),
updateHouseServiceConfig: (id, price, type) => patch('houseServiceConfigs',id,{ unitPrice: Number(price), ...(type ? {calculationType:type} : {}) }),
deleteHouseServiceConfig: id => remove('houseServiceConfigs',id),
addBoardingHouse: input => request('post','/properties',input),
updateBoardingHouse: (id,input) => { if (input.status === 'LOCKED') requireEmptyHouse(id); return request('put',`/properties/${id}`,{...find(view.boardingHouses,id),...input}); },
deleteBoardingHouse: id => { requireEmptyHouse(id); return request('delete',`/properties/${id}`); }
};
}
