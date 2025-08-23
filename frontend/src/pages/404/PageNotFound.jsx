import { path } from '@/core/constants/path'
import { Link } from 'react-router-dom'

const IconLeftArrow = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-6 h-6"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
  </svg>
)

const PageNotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
      <h1 className="font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-gray-800 mb-4">404</h1>
      <h2 className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-6 sm:mb-8 text-center">Page not found</h2>
      <Link to={path.home} className="flex items-center gap-2 text-sm sm:text-base md:text-lg px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
        {IconLeftArrow}
        Return to home
      </Link>
    </div>
  )
}

export default PageNotFound
