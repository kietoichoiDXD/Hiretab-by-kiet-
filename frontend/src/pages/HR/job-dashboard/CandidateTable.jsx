"use client"

import { useState, useMemo } from "react"
import { ChevronDown, Users, Calendar, FileText, Briefcase, ChevronLeft, ChevronRight } from "lucide-react"
import { CANDIDATE_STATUSES } from "./constants/candidateConstants"
import { getStatusConfig, getNextStatus, getStatusButtonClass, formatDate } from "./utils/candidateUtils"
import StatusBadge from "./StatusBadge"

export default function CandidateTable({
  activeTab,
  setActiveTab,
  candidates,
  sortedCandidates,
  selectedCandidates,
  toggleSelectAll,
  toggleCandidateSelection,
  sortConfig,
  setSortConfig,
  onStatusTransition,
  onScanCandidate,
  showJobName = false, // New prop to control job name column visibility
  refetchCandidates,
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedCandidateId, setExpandedCandidateId] = useState(null)
  const [expandedCheckId, setExpandedCheckId] = useState(null)
  const rowsPerPage = 10

  const tabs = [
    CANDIDATE_STATUSES.ALL,
    CANDIDATE_STATUSES.IN_REVIEW,
    CANDIDATE_STATUSES.INTERVIEW,
    CANDIDATE_STATUSES.HIRED,
    CANDIDATE_STATUSES.REJECTED,
  ]

  // Define columns dynamically based on showJobName prop
  const columns = useMemo(() => [
    { key: "name", label: "Candidate", icon: Users, width: "w-56" },
    ...(showJobName ? [{ key: "jobPostingName", label: "Position", icon: Briefcase, width: "w-40" }] : []),
    { key: "createdAt", label: "Applied", icon: Calendar, width: "w-28" },
    { key: "resumeFile", label: "Resume", icon: FileText, width: "w-24" },
    { key: "status", label: "Status", icon: null, width: "w-32" },
    { key: "score", label: "Score", icon: null, width: "w-28" },
    { key: "aiInsight", label: "AI Insight", icon: null, width: "w-40", sortable: false },
    { key: null, label: "Actions", icon: null, width: "w-32" },
  ], [showJobName])

  const tableColSpan = columns.length + 1

  const toggleInsight = (candidateId) => {
    setExpandedCandidateId((prev) => (prev === candidateId ? null : candidateId))
  }

  const getInsightBadgeClass = (status) => {
    switch (status) {
      case "Safe":
        return "bg-green-50 text-green-700 border-green-200"
      case "Risk":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      case "Conflict":
        return "bg-red-50 text-red-700 border-red-200"
      default:
        return "bg-gray-50 text-gray-600 border-gray-200"
    }
  }

  // Pagination logic
  const totalPages = Math.ceil(sortedCandidates.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const currentCandidates = sortedCandidates.slice(startIndex, endIndex)

  // Reset to first page when tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setCurrentPage(1)
    if (refetchCandidates) {
      refetchCandidates()
    }
  }

  // Pagination component
  const PaginationComponent = () => {
    if (sortedCandidates.length <= rowsPerPage) return null

    const getPageNumbers = () => {
      const pages = []
      const maxVisiblePages = 5
      
      if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        let startPage = Math.max(2, currentPage - 1)
        let endPage = Math.min(totalPages - 1, currentPage + 1)
        
        if (currentPage <= 3) {
          endPage = Math.min(4, totalPages - 1)
        }
        if (currentPage >= totalPages - 2) {
          startPage = Math.max(2, totalPages - 3)
        }
        
        if (startPage > 2) {
          pages.push("...")
        }
        
        for (let i = startPage; i <= endPage; i++) {
          pages.push(i)
        }
        
        if (endPage < totalPages - 1) {
          pages.push("...")
        }
        
        if (totalPages > 1) {
          pages.push(totalPages)
        }
      }
      
      return pages
    }

    return (
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center text-sm text-gray-600">
          <span>
            Showing {startIndex + 1} to {Math.min(endIndex, sortedCandidates.length)} of {sortedCandidates.length} candidates
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1 ${
              currentPage === 1
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center space-x-1">
            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === 'number' && setCurrentPage(page)}
                disabled={page === "..."}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  page === currentPage
                    ? "bg-blue-600 text-white"
                    : page === "..."
                    ? "text-gray-400 cursor-default"
                    : "text-gray- gốc tác giả:600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1 ${
              currentPage === totalPages
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Tabs */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const count =
              tab === CANDIDATE_STATUSES.ALL ? candidates.length : candidates.filter((c) => c.status === tab).length
            const statusConfig = getStatusConfig(tab)
            const StatusIcon = statusConfig.icon

            return (
              <button
                key={tab}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 flex items-center space-x-2 ${
                  activeTab === tab
                    ? "text-blue-600 border-blue-600 bg-white"
                    : "text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-100"
                }`}
                onClick={() => handleTabChange(tab)}
              >
                {tab !== CANDIDATE_STATUSES.ALL && <StatusIcon className="w-4 h-4" />}
                <span>{tab}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    activeTab === tab ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden">
        <table className="w-full table-fixed">
          <thead className="bg-blue-50 border-b border-blue-100">
            <tr>
              <th className="px-4 py-4 text-left w-12">
                <input
                  type="checkbox"
                  checked={selectedCandidates.size === currentCandidates.length && currentCandidates.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </th>
              {columns.map((column) => (
                <th
                  key={column.key || column.label}
                  className={`px-4 py-4 text-left text-sm font-semibold text-gray-900 ${column.width}`}
                >
                  {column.key && column.sortable !== false ? (
                    <button
                      className="flex items-center space-x-2 hover:text-blue-600 transition-colors w-full"
                      onClick={() => {
                        const direction =
                          sortConfig.key === column.key && sortConfig.direction === "asc" ? "desc" : "asc"
                        setSortConfig({ key: column.key, direction })
                      }}
                    >
                      {column.icon && <column.icon className="w-4 h-4 flex-shrink-0" />}
                      <span className="truncate">{column.label}</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform flex-shrink-0 ${
                          sortConfig.key === column.key && sortConfig.direction === "asc" ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      {column.icon && <column.icon className="w-4 h-4 flex-shrink-0" />}
                      <span className="truncate">{column.label}</span>
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentCandidates.length > 0 ? (
              currentCandidates.flatMap((candidate) => {
                const isExpanded = expandedCandidateId === candidate.id
                const ai = candidate.aiInsight
                const hasResume = Boolean(candidate.resumeFile)

                const row = (
                  <tr
                    key={candidate.id}
                    className={`hover:bg-gray-50 transition-colors ${selectedCandidates.has(candidate.id) ? "bg-blue-50" : ""}`}
                  >
                  <td className="px-4 py-4 w-12">
                    <input
                      type="checkbox"
                      checked={selectedCandidates.has(candidate.id)}
                      onChange={() => toggleCandidateSelection(candidate.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </td>
                  
                  {/* Candidate Column */}
                  <td className="px-4 py-4 w-56">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-blue-600">
                          {candidate.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate">{candidate.name}</div>
                        <div className="text-xs text-gray-500 truncate">{candidate.email}</div>
                        <div className="text-xs text-gray-400">{candidate.phone || "—"}</div>
                      </div>
                    </div>
                  </td>
                  
                  {/* Position Column (Conditional) */}
                  {showJobName && (
                    <td className="px-4 py-4 w-40">
                      <div className="flex items-center space-x-2">
                        <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {candidate.jobPostingName}
                        </span>
                      </div>
                    </td>
                  )}
                  
                  {/* Applied Date Column */}
                  <td className="px-4 py-4 w-28">
                    <div className="text-sm text-gray-600">{formatDate(candidate.createdAt)}</div>
                  </td>
                  
                  {/* Resume Column */}
                  <td className="px-4 py-4 w-24">
                    {candidate.resumeFile ? (
                      <a
                        href={candidate.resumeFile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        <FileText className="w-4 h-4" />
                        <span>View</span>
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>
                  
                  {/* Status Column */}
                  <td className="px-4 py-4 w-32">
                    <StatusBadge status={candidate.status} />
                  </td>
                  
                  {/* Score Column */}
                  <td className="px-4 py-4 w-28">
                    <div className="flex items-center space-x-2">
                      <div className="text-sm font-medium text-gray-900">{candidate.score}%</div>
                      <div className="w-12 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${candidate.score}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>

                  {/* AI Insight Column */}
                  <td className="px-4 py-4 w-40">
                    {ai ? (
                      <div className="flex flex-col gap-2">
                        <span
                          className={`inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-md border ${getInsightBadgeClass(ai.status)}`}
                        >
                          {ai.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleInsight(candidate.id)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                        >
                          {isExpanded ? "Hide" : "View"}
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <span className="text-xs text-gray-400">Not scanned</span>
                        <button
                          type="button"
                          disabled={!onScanCandidate}
                          onClick={() => onScanCandidate && onScanCandidate(candidate.id)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={!hasResume ? "No CV uploaded" : "Run AI scan"}
                        >
                          Scan
                        </button>
                      </div>
                    )}
                  </td>
                  
                  {/* Actions Column */}
                  <td className="px-4 py-4 w-32">
                    {getNextStatus(candidate.status) ? (
                      <button
                        onClick={() => onStatusTransition(candidate.id, candidate.status)}
                        className={`px-3 py-1.5 text-white text-xs font-medium rounded-lg transition-all duration-200 ${getStatusButtonClass(getNextStatus(candidate.status))}`}
                      >
                        → {getNextStatus(candidate.status)}
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs font-medium">Final</span>
                    )}
                  </td>
                  </tr>
                )

                const detailRow = isExpanded ? (
                  <tr key={`${candidate.id}-ai-detail`} className="bg-gray-50">
                    <td colSpan={tableColSpan} className="px-4 py-4">
                      <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-gray-900">AI Insight — Passed/Failed checks</div>
                          {ai?.updatedAt && (
                            <div className="text-xs text-gray-500">Updated: {formatDate(ai.updatedAt)}</div>
                          )}
                        </div>

                        {ai?.summary && (
                          <div className="mt-2 text-sm text-gray-700">{ai.summary}</div>
                        )}

                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(ai?.checks || []).map((check) => {
                            const isCheckExpanded = expandedCheckId === `${candidate.id}-${check.key}`;
                            return (
                              <div 
                                key={check.key} 
                                className={`border rounded-lg p-3 cursor-pointer transition-all ${isCheckExpanded ? 'border-blue-300 bg-blue-50/50 shadow-sm' : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'}`}
                                onClick={() => setExpandedCheckId(isCheckExpanded ? null : `${candidate.id}-${check.key}`)}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                    {check.label}
                                    {check.conflicts?.length > 0 && (
                                      <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                                        {check.conflicts.length} issues
                                      </span>
                                    )}
                                  </div>
                                  <span
                                    className={`px-2 py-0.5 text-xs font-medium rounded-md border ${check.pass ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}
                                  >
                                    {check.pass ? "PASS" : "FAIL"}
                                  </span>
                                </div>
                                {check.detail && <div className="mt-1 text-xs text-gray-600">{check.detail}</div>}
                                
                                {isCheckExpanded && check.conflicts && check.conflicts.length > 0 && (
                                  <div className="mt-3 pt-2 border-t border-gray-200/50 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                                      <span className="w-1 h-1 rounded-full bg-red-500"></span>
                                      Conflict Analysis
                                    </div>
                                    <div className="space-y-2">
                                      {check.conflicts.map((conflict, idx) => (
                                        <div key={idx} className="bg-white p-2.5 rounded border border-red-100 text-xs shadow-sm">
                                          <div className="flex justify-between mb-1">
                                            <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px]">{conflict.source}</span>
                                          </div>
                                          <div className="text-gray-900 mb-1.5 font-medium bg-gray-50 p-1.5 rounded">"{conflict.text}"</div>
                                          <div className="text-red-600 flex items-start gap-1.5">
                                            <span className="mt-0.5">⚠️</span>
                                            <span>{conflict.reason}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : null

                return detailRow ? [row, detailRow] : [row]
              })
            ) : (
              <tr>
                <td colSpan={tableColSpan} className="px-8 py-16 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                      <Users className="w-10 h-10 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">No candidates found</p>
                      <p className="text-sm text-gray-500">Try adjusting your search or filter criteria</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <PaginationComponent />
    </div>
  )
}