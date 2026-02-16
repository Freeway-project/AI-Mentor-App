export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">
          AI Mentor Platform
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Find and connect with expert mentors powered by AI
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">AI-Powered Search</h2>
            <p className="text-gray-600">
              Find the perfect mentor using natural language queries
            </p>
          </div>

          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Smart Scheduling</h2>
            <p className="text-gray-600">
              Book meetings that fit your schedule automatically
            </p>
          </div>

          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Real-time Chat</h2>
            <p className="text-gray-600">
              Communicate with mentors before and after sessions
            </p>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Setup Complete!</strong> The monorepo is ready. Run <code className="px-2 py-1 bg-blue-100 rounded">bun install</code> to get started.
          </p>
        </div>
      </div>
    </main>
  );
}
