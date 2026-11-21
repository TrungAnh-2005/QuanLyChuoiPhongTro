import { createContext, useContext } from 'react';

// Shared contract; the app composes feature data in app/data/DataProvider.jsx.
export const RentalDataContext = createContext(null);
export const useData = () => useContext(RentalDataContext);
