import { BrowserRouter } from 'react-router-dom';
import AppProviders from './providers';
import AppRoutes from './routes';
import ApiStatus from '../components/app/ApiStatus';

export default function App() {
  return <BrowserRouter><AppProviders><ApiStatus /><AppRoutes /></AppProviders></BrowserRouter>;
}
