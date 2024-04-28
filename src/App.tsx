import './App.css'
import { RouterProvider, useNavigate } from 'react-router-dom';
import { router } from './routes/router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { handleBackendMessage } from './helper/BackendMessageHandler';
import { useDispatch } from 'react-redux';
import Titlebar from './components/Titlebar';
import { Box } from '@mui/material';
import ContextMenu from './components/contextMenus/ContextMenu';
import { copy, paste, showDeveloperTools } from './components/contextMenus/ContextMenuOptions';
import { getPlatform, isMobile } from './helper/PlatformHelper';

function App() {
  const dispatch = useDispatch();
  const mainElementRef = useRef<HTMLDivElement>(null);
  const [mobile, setMobile] = useState<boolean>(false);
  const [platform, setPlatform] = useState<string>("" as string);

  const getOs = useCallback(async () => {
    setMobile(await isMobile());
    setPlatform(await getPlatform());
  }, []);

  useEffect(() => {
    getOs();
    //listen to a event
    const unlisten = listen("backend_update", e => handleBackendMessage(e, dispatch));

    return () => {
      unlisten.then(f => f());
    }
  });

  const titlebar = mobile ? (<span />) : <Titlebar />;

  return (
    <div className="App">
      {titlebar}
      <Box sx={{ flex: 1, overflow: 'auto' }} ref={mainElementRef}>
        <RouterProvider router={router} />
      </Box>
      <ContextMenu options={[copy, paste, showDeveloperTools]} element={mainElementRef} />
    </div>
  )
}

export default App
