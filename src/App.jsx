import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './components/Dashboard'
import Calculator from './components/Calculator'
import AIInsights from './components/AIInsights'
import ActionTracker from './components/ActionTracker'

function App() {
  return (
    <div className="min-h-screen bg-darkGreen text-lightGreen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/insights" element={<AIInsights />} />
          <Route path="/actions" element={<ActionTracker />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
