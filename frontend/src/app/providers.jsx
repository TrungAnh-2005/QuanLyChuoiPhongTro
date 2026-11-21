import { AuthProvider } from '../features/auth/AuthContext';
import { DataProvider } from './data/DataProvider';

export default function AppProviders({ children }) {
  return <AuthProvider><DataProvider>{children}</DataProvider></AuthProvider>;
}
