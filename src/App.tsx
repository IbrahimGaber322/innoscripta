import { Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ArticlePage } from './pages/ArticlePage'
import { ForYouPage } from './pages/ForYouPage'
import { HomePage } from './pages/HomePage'
import { SettingsPage } from './pages/SettingsPage'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="for-you" element={<ForYouPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="article/:encodedId" element={<ArticlePage />} />
      </Route>
    </Routes>
  )
}

export default App
