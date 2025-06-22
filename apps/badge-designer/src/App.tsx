import Toolbox from './components/Toolbox';
import Canvas from './components/Canvas';
import PropertiesPanel from './components/PropertiesPanel';
import Header from './components/Header';

function App() {
  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Toolbox />
        <main className="flex-1 flex items-center justify-center p-4 overflow-auto bg-gray-200">
          <Canvas />
        </main>
        <PropertiesPanel />
      </div>
    </div>
  );
}

export default App;
