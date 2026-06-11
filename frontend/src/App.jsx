import { Toaster } from 'react-hot-toast'
import AppRoutes from './routes/index.jsx'

function App() {
  return (
    <>
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#16161E',
            color: '#fff',
            border: '1px solid #2a2a3a',
          },
          success: { iconTheme: { primary: '#D4AF37', secondary: '#000' } },
        }}
      />
    </>
  )
}

export default App
