import Navbar from '@/components/shared/Navbar'
import Footer from '@/components/shared/Footer'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="text-4xl font-bold text-gray-900">
          Welcome to <span className="text-indigo-600">CareerSetu</span>
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Practice voice-based mock interviews with an AI interviewer and get honest, structured feedback.
        </p>
      </main>
      <Footer />
    </>
  )
}
