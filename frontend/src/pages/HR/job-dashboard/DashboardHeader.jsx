"use client"

import { Search, Filter, Users, Mail } from "lucide-react"
import { SORT_OPTIONS } from "./constants/candidateConstants"

export default function DashboardHeader({
  jobName,
  candidatesCount,
  searchQuery,
  setSearchQuery,
  showFilterPanel,
  setShowFilterPanel,
  filtersCount,
  sortConfig,
  setSortConfig,
  selectedCandidatesCount,
  onSendEmail,
}) {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200 top-0 z-50 backdrop-blur-sm">
      <div className="px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          {/* Left side - Job info */}
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{jobName}</h1>
                <p className="text-xs text-gray-500">{candidatesCount} total candidates</p>
              </div>
            </div>
          </div>

          {/* Right side - Controls */}
          <div className="flex items-center space-x-2 flex-wrap w-full sm:w-auto">
            {/* Search Bar */}
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search candidates..."
                className="pl-8 pr-3 py-2 w-full sm:w-48 lg:w-56 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter Button */}
            <button
              className={`px-2 sm:px-3 py-2 border rounded-lg flex items-center space-x-1 text-xs sm:text-sm font-medium transition-all duration-200 flex-shrink-0 ${showFilterPanel
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              onClick={() => setShowFilterPanel(!showFilterPanel)}
            >
              <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Filter</span>
              {filtersCount > 0 && (
                <span className="px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">{filtersCount}</span>
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-1 flex-shrink-0">
              <span className="text-xs sm:text-sm text-gray-600 font-medium hidden lg:inline">Sort:</span>
              <select
                className="px-1 sm:px-2 py-2 border border-gray-300 rounded-lg bg-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={`${sortConfig.key}-${sortConfig.direction}`}
                onChange={(e) => {
                  const [key, direction] = e.target.value.split("-")
                  setSortConfig({ key, direction })
                }}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Send Email Button */}
            <button
              className={`px-2 sm:px-3 py-2 rounded-lg flex items-center space-x-1 text-xs sm:text-sm font-medium transition-all duration-200 flex-shrink-0 ${selectedCandidatesCount > 0
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              onClick={onSendEmail}
              disabled={selectedCandidatesCount === 0}
            >
              <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Send Email ({selectedCandidatesCount})</span>
              <span className="sm:hidden">✉ ({selectedCandidatesCount})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}