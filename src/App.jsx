import { useState } from 'react'

function App() {
  const [appState, setAppState] = useState({
    config: {
      endpoint: localStorage.getItem("endpoint") || "",
      separator: localStorage.getItem("separator") || ";",
    },
    data: {
      original: [],
      results: [],
      merged: [],
    },
    processing: {
      isActive: false,
      jobId: null,
      progress: { completed: 0, total: 0, percentage: 0 },
      timeRemaining: null,
    },
    metrics: {
      icc: null,
      meanDeviation: null,
      stdDeviation: null,
      reliabilityMet: false,
      processedCount: 0,
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          📊 Evaluador de Textos Educativos
        </h1>
        
        <div className="space-y-6">
          {/* Placeholder for components */}
          <div className="text-center text-muted-foreground">
            <p>Phase 1 setup completed successfully!</p>
            <p>Ready for Phase 2 development.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
