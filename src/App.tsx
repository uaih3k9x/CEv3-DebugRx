import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import WorkflowPage from './pages/WorkflowPage';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/workflow" element={<WorkflowPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
