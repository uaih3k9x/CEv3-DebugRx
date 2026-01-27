import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import WorkflowPage from './pages/WorkflowPage';
import HealthCheckPage from './pages/HealthCheckPage';
import DataDiagnosticPage from './pages/DataDiagnosticPage';
import ServiceMonitorPage from './pages/ServiceMonitorPage';
import ConfigCheckPage from './pages/ConfigCheckPage';
import TagManagementPage from './pages/TagManagementPage';
import UsersPage from './pages/UsersPage';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/workflow" element={<WorkflowPage />} />
          <Route path="/health" element={<HealthCheckPage />} />
          <Route path="/diagnostic" element={<DataDiagnosticPage />} />
          <Route path="/monitor" element={<ServiceMonitorPage />} />
          <Route path="/config" element={<ConfigCheckPage />} />
          <Route path="/tags" element={<TagManagementPage />} />
          <Route path="/users" element={<UsersPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
