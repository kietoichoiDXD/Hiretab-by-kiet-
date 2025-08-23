import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ChevronDown, Download } from "lucide-react"
import { Link } from 'react-router-dom'
import Logo from '@/components/landing/Logo'
import { path } from '@/core/constants/path'

export default function ResumeHeader({ onTemplateClick, onColorClick, onExport, onImport }) {
  const handleImportClick = () => {
    document.getElementById("import-file").click()
  }

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-white/95 backdrop-blur-md text-gray-800 px-3 sm:px-4 lg:px-6 py-3 flex items-center justify-between shadow-lg border-b border-gray-200"
    >
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex items-center space-x-2 flex-shrink-0"
      >
        <Logo className="w-8 h-8 sm:w-10 sm:h-10" />
      </motion.div>

      {/* Right side navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex items-center space-x-1 sm:space-x-2 flex-wrap"
      >
        {/* Template and Color buttons */}
        <motion.div whileHover={{ scale: 1.05 }}>
          <Button
            variant="ghost"
            className="text-gray-700 hover:bg-gray-100 flex items-center space-x-1 transition-colors font-medium px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm"
            onClick={onTemplateClick}
          >
            <span className="hidden sm:inline">TEMPLATES (3)</span>
            <span className="sm:hidden">TEMP</span>
            <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }}>
          <Button
            variant="ghost"
            className="text-gray-700 hover:bg-gray-100 flex items-center space-x-1 transition-colors font-medium px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm"
            onClick={onColorClick}
          >
            <span className="hidden sm:inline">COLOURS</span>
            <span className="sm:hidden">COLOR</span>
            <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </motion.div>

        {/* Divider */}
        <div className="w-px h-4 sm:h-6 bg-gray-300 mx-1 sm:mx-2 hidden sm:block"></div>

        {/* Action buttons */}
        <motion.div whileHover={{ scale: 1.05 }}>
          <Button variant="ghost" className="text-gray-700 hover:bg-gray-100 transition-colors font-medium px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm" onClick={onExport}>
            <span className="hidden sm:inline">EXPORT</span>
            <Download className="w-3 h-3 sm:hidden" />
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }}>
          <Button variant="ghost" className="text-gray-700 hover:bg-gray-100 transition-colors font-medium px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm" onClick={handleImportClick}>
            <span className="hidden sm:inline">IMPORT</span>
            <span className="sm:hidden">IMP</span>
          </Button>
        </motion.div>

      </motion.div>
    </motion.header>
  )
}