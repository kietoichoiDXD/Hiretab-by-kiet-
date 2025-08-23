import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Menu, X, User, LogOut, Search, Bell, Briefcase, Headset, Contact} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import HireTabLogo from '@/assets/images/hiretab-logo.png'
import { path } from '@/core/constants/path'

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    navigate('/login')
    setUser(null)
  }

  const menuItems = [
    { label: 'Find Jobs', href: '#jobs', icon: Search },
    { label: 'Resume', href: path.create_resume, icon: Contact },
    { label: 'Mission & Value', href: '#advice', icon: Briefcase },
    { label: 'Contact Us', href: '#about', icon: Headset }
  ]

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.2 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100'
          : 'bg-white/90 backdrop-blur-sm'
      } select-none`}
    >
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between transition-all duration-300 ${
          isScrolled ? 'h-16 py-0' : 'h-20 py-2'
        }`}>
          
          {/* Logo & Brand */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center space-x-2 sm:space-x-3 cursor-pointer min-w-0 flex-1 sm:flex-none"
            onClick={() => navigate(path.home)}
            tabIndex={0}
            role="button"
          >
            <img 
              src={HireTabLogo} 
              alt="HireTab" 
              className={`transition-all duration-300 flex-shrink-0 ${
                isScrolled ? 'w-8 h-8 sm:w-10 sm:h-10' : 'w-10 h-10 sm:w-12 sm:h-12'
              }`} 
              draggable={false}
            />
            <div className="flex flex-col min-w-0">
              <span className={`font-bold text-gray-900 transition-all duration-300 truncate ${
                isScrolled ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'
              }`}>
                Hiretab
              </span>
              <span className="-mt-1 text-xs font-medium text-blue-600 truncate">
                Your Career Partner
              </span>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="items-center hidden space-x-8 md:flex"
          >
            {menuItems.map((item, index) => (
              <motion.a
                key={index}
                href={item.href}
                className="flex items-center px-3 py-2 space-x-2 font-medium text-gray-700 transition-colors duration-200 hover:text-blue-600"
              >
                {item.icon && <item.icon className="w-4 h-4" />}
                <span>{item.label}</span>
              </motion.a>
            ))}
          </motion.nav>

          {/* Mobile menu button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center space-x-2 md:hidden"
          >
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </motion.div>

          {/* Right Side - Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="items-center hidden flex-shrink-0 md:flex"
          >
            <Button variant="secondary" className="px-3 py-1.5 sm:px-4 sm:py-2 lg:px-6 lg:py-2 text-sm sm:text-base font-bold text-white bg-blue-900 border-blue-600 hover:bg-white hover:text-blue-600 whitespace-nowrap">
              <Link to='/candidate/job' className="block">
                <span className="hidden sm:inline">Apply Now</span>
                <span className="sm:hidden">Apply</span>
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Mobile Navigation Menu - Right Slide Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Right Side Navigation Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 md:hidden overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <img 
                    src={HireTabLogo} 
                    alt="HireTab" 
                    className="h-8 w-auto" 
                  />
                  <span className="text-xl font-bold text-gray-900">HireTab</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="p-6 space-y-2">
                {menuItems.map((item, index) => (
                  <motion.a
                    key={index}
                    href={item.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.1 }}
                    className="flex items-center px-4 py-4 space-x-4 font-medium text-gray-700 transition-all duration-200 hover:text-blue-600 hover:bg-blue-50 rounded-xl group"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg group-hover:bg-blue-100 transition-colors">
                      {item.icon && <item.icon className="w-5 h-5 group-hover:text-blue-600" />}
                    </div>
                    <span className="text-lg">{item.label}</span>
                  </motion.a>
                ))}
              </div>
              
              {/* Mobile Apply Button */}
              <div className="p-6 border-t border-gray-100">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Link
                    to='/candidate/job'
                    className="flex items-center justify-center w-full px-6 py-4 text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Apply Now
                  </Link>
                </motion.div>
              </div>

              {/* Bottom Section */}
              <div className="p-6 mt-auto border-t border-gray-100">
                <div className="text-center text-sm text-gray-500">
                  <p>© 2025 HireTab</p>
                  <p className="mt-1">Find your dream job today</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

export default Header