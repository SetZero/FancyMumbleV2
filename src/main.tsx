import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { ThemeProvider, createTheme } from '@mui/material';
import { store } from './store/store'
import { Provider } from 'react-redux'
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';
import relativeTime from 'dayjs/plugin/relativeTime';
import Loader from './components/Loader';
import hljs from 'highlight.js';
import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import './i18n/i18n';
import 'dayjs/locale/de';
import 'dayjs/locale/en';
import 'dayjs/locale/zh';
import 'dayjs/locale/fr';
import 'dayjs/locale/es';

import 'highlight.js/styles/base16/equilibrium-gray-dark.css';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

marked.use(markedHighlight({
  langPrefix: 'hljs language-',
  highlight(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  }
}));

marked.use({
  breaks: true,
  mangle: false,
  headerIds: false
})

dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(relativeTime)

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider theme={darkTheme}>
      <Suspense fallback={<Loader />}>
        <Provider store={store}>
          <App />
        </Provider>
      </Suspense>
    </ThemeProvider>
  </React.StrictMode>,
)
