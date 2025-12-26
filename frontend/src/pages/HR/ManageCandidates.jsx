"use client"

import { useState, useMemo } from "react"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { XCircle } from "lucide-react"
import { candidateApi } from "@/core/services/candidate.service";
import { toast } from "react-toastify"

import { CANDIDATE_STATUSES } from "./job-dashboard/constants/candidateConstants"
import { applyFilters, getAvailableStatusTransitions, getNextStatus } from "./job-dashboard/utils/candidateUtils"

import DashboardHeader from "./job-dashboard/DashboardHeader"
import BulkActionsBar from "./job-dashboard/BulkActionsBar"
import CandidateTable from "./job-dashboard/CandidateTable"
import FilterModal from "./job-dashboard/FilterModal"
import EmailModal from "./job-dashboard/EmailModal"
import ConfirmModal from "./job-dashboard/ConfirmModal"

export default function ManageCandidates() {
  const [activeTab, setActiveTab] = useState(CANDIDATE_STATUSES.ALL)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" })
  const [selectedCandidates, setSelectedCandidates] = useState(new Set())
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [filters, setFilters] = useState([])
  const [filterLogic, setFilterLogic] = useState("all")

  // Status Confirmation Modal
  const [statusConfirmModal, setStatusConfirmModal] = useState({
    isOpen: false,
    candidateId: null,
    candidateName: "",
    currentStatus: "",
    nextStatus: "",
  })

  // Email Modal States
  const [emailModalState, setEmailModalState] = useState("closed")
  const [emailData, setEmailData] = useState({
    to: "",
    cc: "",
    bcc: "",
    subject: "",
    body: "",
  })
  const [showCcBcc, setShowCcBcc] = useState(false)
  const [showFormattingToolbar, setShowFormattingToolbar] = useState(false)
  const [textFormatting, setTextFormatting] = useState({
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: 16,
    bold: false,
    italic: false,
    underline: false,
    textColor: "#1f2937",
    textAlign: "left",
  })
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showAlignmentMenu, setShowAlignmentMenu] = useState(false)
  const [showListMenu, setShowListMenu] = useState(false)
  const [undoStack, setUndoStack] = useState([])
  const [redoStack, setRedoStack] = useState([])
  const [showQuickReplyPrompt, setShowQuickReplyPrompt] = useState(false)
  const [quickReplyPrompt, setQuickReplyPrompt] = useState("")
  const [isGeneratingContent, setIsGeneratingContent] = useState(false)

  const queryClient = useQueryClient()

  const {
    data: candidates = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["allCandidates"],
    queryFn: async () => {
      try {
        const response = await candidateApi.getPaginationCandidate(1, 100) // Adjust page/size as needed
        return response.data || [] // Adjust based on response structure
      } catch (error) {
        console.warn("Backend unavailable, using MOCK candidates for AI scan demo")
        
        const localCandidates = JSON.parse(localStorage.getItem('mock_candidates') || '[]');
        
        const staticCandidates = [
          {
            id: 1,
            name: "Tran Quoc Kiet",
            email: "kiet@gmail.com",
            jobPostingName: "Senior Full-Stack",
            phone: "0905709804",
            status: "In-Review",
            score: 95,
            createdAt: "2025-12-25",
            resumeFile: "https://example.com/cv/kiet.pdf",
          },
          {
            id: 2,
            name: "Aleksei Savchenko",
            email: "aleksei@email.com",
            jobPostingName: "AI Engineer",
            phone: "+84 909 345 678",
            status: "In-Review",
            score: 72,
            createdAt: "2025-12-23",
            resumeFile: "https://example.com/cv/aleksei.pdf",
          },
          {
            id: 3,
            name: "Truong Cong Hoang",
            email: "hoang@email.com",
            jobPostingName: "Backend Dev",
            phone: "0912345678",
            status: "Interview",
            score: 42,
            createdAt: "2025-12-23",
            resumeFile: "https://example.com/cv/hoang.pdf",
          },
          {
            id: 4,
            name: "Nguyen Le Tien Dat",
            email: "dat@email.com",
            jobPostingName: "Frontend Lead",
            phone: "0987654321",
            status: "Hired",
            score: 88,
            createdAt: "2025-11-29",
            resumeFile: "https://example.com/cv/dat.pdf",
          },
          {
            id: 5,
            name: "Jane Doe",
            email: "jane@email.com",
            jobPostingName: "Machine Learning",
            phone: "0123456789",
            status: "In-Review",
            score: 24,
            createdAt: "2025-10-19",
            resumeFile: "",
          },
        ];
        return [...localCandidates, ...staticCandidates];
      }
    },
    refetchOnWindowFocus: false,
  })

  const bulkUpdateStatusMutation = useMutation({
    mutationFn: ({ candidateIds, status }) =>
      Promise.all(
        candidateIds.map((id) => candidateApi.updateStatus(id, status))
      ),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["allCandidates"])
      toast.success(`Updated ${variables.candidateIds.length} candidates to ${variables.status}`)
      setSelectedCandidates(new Set())
    },
    onError: (error) => {
      console.error("Error bulk updating status:", error)
      toast.error("Failed to update candidates")
    },
  })

  const toggleCandidateSelection = (candidateId) => {
    const newSelected = new Set(selectedCandidates)
    if (newSelected.has(candidateId)) {
      newSelected.delete(candidateId)
    } else {
      newSelected.add(candidateId)
    }
    setSelectedCandidates(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedCandidates.size === filteredCandidates.length) {
      setSelectedCandidates(new Set())
    } else {
      setSelectedCandidates(new Set(filteredCandidates.map((c) => c.id)))
    }
  }

  const filteredCandidates = useMemo(() => {
    let result = [...candidates]
    if (activeTab !== CANDIDATE_STATUSES.ALL) {
      result = result.filter((candidate) => candidate.status === activeTab)
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (candidate) =>
          candidate.name.toLowerCase().includes(query) ||
          candidate.email.toLowerCase().includes(query) ||
          candidate.phone?.toLowerCase().includes(query) ||
          candidate.jobPostingName.toLowerCase().includes(query),
      )
    }
    result = applyFilters(result, filters, filterLogic)
    return result
  }, [candidates, activeTab, searchQuery, filters, filterLogic])

  const sortedCandidates = useMemo(() => {
    const sortableItems = [...filteredCandidates]
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1
        }
        return 0
      })
    }
    return sortableItems
  }, [filteredCandidates, sortConfig])

  const availableTransitions = getAvailableStatusTransitions(selectedCandidates, candidates, activeTab)

  const handleStatusTransition = (candidateId, currentStatus) => {
    const nextStatus = getNextStatus(currentStatus)
    if (!nextStatus) return

    // Find candidate name for confirmation modal
    const candidate = candidates.find(c => c.id === candidateId)

    // Show confirmation modal
    setStatusConfirmModal({
      isOpen: true,
      candidateId,
      candidateName: candidate?.name || "Unknown",
      currentStatus,
      nextStatus,
    })
  }

  const handleStatusConfirm = () => {
    const { candidateId, nextStatus } = statusConfirmModal

    // Update status after confirmation
    bulkUpdateStatusMutation.mutate({
      candidateIds: [candidateId],
      status: nextStatus,
    })

    // Close modal
    setStatusConfirmModal({
      isOpen: false,
      candidateId: null,
      candidateName: "",
      currentStatus: "",
      nextStatus: "",
    })
  }

  const handleStatusCancel = () => {
    setStatusConfirmModal({
      isOpen: false,
      candidateId: null,
      candidateName: "",
      currentStatus: "",
      nextStatus: "",
    })
  }

  const handleBulkStatusUpdate = (newStatus) => {
    if (selectedCandidates.size === 0) return

    const selectedCandidatesList = candidates.filter((c) => selectedCandidates.has(c.id))
    const validCandidates = selectedCandidatesList.filter((candidate) => {
      switch (newStatus) {
        case CANDIDATE_STATUSES.INTERVIEW:
          return candidate.status === CANDIDATE_STATUSES.IN_REVIEW || candidate.status === CANDIDATE_STATUSES.HIRED
        case CANDIDATE_STATUSES.HIRED:
          return candidate.status === CANDIDATE_STATUSES.INTERVIEW
        case CANDIDATE_STATUSES.REJECTED:
          return candidate.status === CANDIDATE_STATUSES.INTERVIEW
        default:
          return false
      }
    })

    if (validCandidates.length === 0) {
      toast.error(`No selected candidates can be moved to ${newStatus}`)
      return
    }

    // Directly update without confirmation popup
    bulkUpdateStatusMutation.mutate({
      candidateIds: validCandidates.map((c) => c.id),
      status: newStatus,
    })
  }

  const buildMockAiInsight = (candidate) => {
    const hasResume = Boolean(candidate?.resumeFile)
    const score = Number(candidate?.score ?? 0)
    const experiencePass = score >= 60
    const skillsPass = score >= 70
    const projectsPass = score >= 65
    const educationPass = score >= 50

    const status = !hasResume
      ? "Conflict"
      : !experiencePass && !skillsPass
        ? "Conflict"
        : !experiencePass || !skillsPass
          ? "Risk"
          : "Safe"

    const checks = [
      {
        key: "cv",
        label: "CV provided",
        pass: hasResume,
        detail: hasResume ? "CV is available for scanning." : "No CV file/link found for this candidate.",
        conflicts: []
      },
      {
        key: "experience",
        label: "Experience vs JD",
        pass: experiencePass,
        detail: experiencePass
          ? "Meets minimum experience requirement."
          : "Below minimum experience threshold.",
        conflicts: experiencePass ? [] : [
            {
              source: "CV - Work History",
              text: "Junior Developer at ABC Corp (2022-2024)",
              reason: "Total duration is 2 years."
            },
            {
              source: "Job Description",
              text: "Required: 5+ years of experience in Software Development.",
              reason: "Requirement not met."
            }
        ]
      },
      {
        key: "skills",
        label: "Skills match",
        pass: skillsPass,
        detail: skillsPass ? "Required skills coverage looks good." : "Missing some required skills.",
        conflicts: skillsPass ? [] : [
             {
              source: "CV - Skills Section",
              text: "React, Node.js, MongoDB, Express",
              reason: "Missing DevOps tools."
            },
            {
              source: "Job Description",
              text: "Must have experience with Docker and Kubernetes.",
              reason: "Critical skill gap."
            }
        ]
      },
      {
        key: "projects",
        label: "Project relevance",
        pass: projectsPass,
        detail: projectsPass ? "Projects mention relevant keywords." : "Projects lack JD-relevant keywords.",
        conflicts: []
      },
      {
        key: "education",
        label: "Education",
        pass: educationPass,
        detail: educationPass ? "Education baseline satisfied." : "Education evidence is weak/unclear.",
        conflicts: educationPass ? [] : [
             {
              source: "CV - Education",
              text: "Bachelor of Arts in History",
              reason: "Non-technical degree."
            },
            {
              source: "Job Description",
              text: "Bachelor's degree in Computer Science or related field.",
              reason: "Field of study mismatch."
            }
        ]
      },
    ]

    return {
      status,
      summary: `Estimated Match Score: ${Number.isFinite(score) ? score : 0}/100`,
      checks,
      updatedAt: new Date().toISOString(),
    }
  }

  const applyAiInsight = (candidate) => ({
    ...candidate,
    aiInsight: buildMockAiInsight(candidate),
  })

  const handleBulkScan = () => {
    if (selectedCandidates.size === 0) return

    const selectedSet = new Set(Array.from(selectedCandidates).map(String))
    toast.info(`Scanning ${selectedCandidates.size} CV(s) with AI Engine...`)

    queryClient.setQueryData(["allCandidates"], (oldData) => {
      const list = Array.isArray(oldData) ? oldData : oldData?.data
      if (!Array.isArray(list)) return oldData

      const next = list.map((c) => (selectedSet.has(String(c.id)) ? applyAiInsight(c) : c))
      return Array.isArray(oldData) ? next : { ...oldData, data: next }
    })

    setTimeout(() => {
      toast.success("AI scan completed")
      setSelectedCandidates(new Set())
    }, 400)
  }

  const handleScanCandidate = (candidateId) => {
    toast.info("Scanning candidate CV with AI Engine...")
    queryClient.setQueryData(["allCandidates"], (oldData) => {
      const list = Array.isArray(oldData) ? oldData : oldData?.data
      if (!Array.isArray(list)) return oldData

      const next = list.map((c) => (String(c.id) === String(candidateId) ? applyAiInsight(c) : c))
      return Array.isArray(oldData) ? next : { ...oldData, data: next }
    })
    setTimeout(() => toast.success("AI scan completed"), 250)
  }

  const handleSendEmail = () => {
    if (selectedCandidates.size === 0) return
    if (emailModalState === "minimized") {
      setEmailModalState("normal")
      return
    }

    const selectedCandidatesList = candidates.filter((c) => selectedCandidates.has(c.id))
    const emailAddresses = selectedCandidatesList.map((c) => c.email).join(", ")

    setEmailData({
      to: emailAddresses,
      cc: "",
      bcc: "",
      subject: `Regarding your job applications`,
      body: "",
    })
    setEmailModalState("normal")
  }

  const closeEmailModal = () => {
    setEmailModalState("closed")
    setShowCcBcc(false)
    setEmailData({ to: "", cc: "", bcc: "", subject: "", body: "" })
    setShowFormattingToolbar(false)
    setShowQuickReplyPrompt(false)
  }

  const minimizeEmailModal = () => {
    setEmailModalState("minimized")
  }

  const maximizeEmailModal = () => {
    setEmailModalState(emailModalState === "maximized" ? "normal" : "maximized")
  }

  const sendEmail = async () => {
    if (!emailData.to.trim()) {
      toast.error("Please enter recipient email address")
      return
    }
    if (!emailData.subject.trim()) {
      toast.error("Please enter email subject")
      return
    }
    if (!emailData.body.trim()) {
      toast.error("Please enter email content")
      return
    }

    try {
      const sendButton = document.querySelector("[data-send-button]")
      if (sendButton) {
        sendButton.disabled = true
        sendButton.innerHTML =
          '<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>Sending...'
      }

      const response = await fetch(import.meta.env.VITE_EMAIL_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: emailData.to,
          subject: emailData.subject,
          body: emailData.body,
          cc: emailData.cc || "",
          bcc: emailData.bcc || "",
        }),
      })

      if (response.ok) {
        toast.success("Email sent successfully!")
        closeEmailModal()
        setSelectedCandidates(new Set())
      } else {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error("Error sending email:", error)
      toast.error(`Failed to send email: ${error.message}`)
    } finally {
      const sendButton = document.querySelector("[data-send-button]")
      if (sendButton) {
        sendButton.disabled = false
        sendButton.innerHTML =
          'Send <svg class="w-3.5 h-3.5 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"></path></svg>'
      }
    }
  }

  const generateEmailContent = async () => {
    if (!quickReplyPrompt.trim()) return
    setIsGeneratingContent(true)

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Write a professional email based on this prompt: "${quickReplyPrompt}". The email should be polite, professional, and suitable for business communication. Context: This is regarding job applications for multiple positions.`,
                  },
                ],
              },
            ],
          }),
        },
      )

      const data = await response.json()
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const generatedContent = data.candidates[0].content.parts[0].text
        setEmailData({ ...emailData, body: generatedContent })
        setShowQuickReplyPrompt(false)
        setQuickReplyPrompt("")
      } else {
        console.error("Unexpected API response:", data)
        toast.error("Failed to generate content. Please try again.")
      }
    } catch (error) {
      console.error("Error generating content:", error)
      toast.error("Failed to generate content. Please check your connection and try again.")
    } finally {
      setIsGeneratingContent(false)
    }
  }

  const handleAttachment = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.multiple = true
    input.accept = ".pdf,.doc,.docx,.txt,.jpg,.png"
    input.onchange = (e) => {
      const files = Array.from(e.target.files)
      console.log("Selected files:", files)
      toast.success(`Selected ${files.length} file(s) for attachment`)
    }
    input.click()
  }

  const handleInsertLink = () => {
    const url = prompt("Enter URL:")
    if (url) {
      const selectedText = window.getSelection().toString()
      const linkText = selectedText || url
      const newText = `[${linkText}](${url})`
      setEmailData({ ...emailData, body: emailData.body + newText })
    }
  }

  const handleInsertEmoji = () => {
    const emojis = ["😊", "👍", "🙏", "💼", "📧", "✅", "❤️", "🎉", "🔥", "💯"]
    const selectedEmoji = prompt(
      `Select emoji by number (1-${emojis.length}):\n${emojis.map((emoji, i) => `${i + 1}. ${emoji}`).join("\n")}`,
    )
    if (selectedEmoji && !isNaN(selectedEmoji) && selectedEmoji >= 1 && selectedEmoji <= emojis.length) {
      const emoji = emojis[selectedEmoji - 1]
      setEmailData({ ...emailData, body: emailData.body + emoji })
    }
  }

  const handleInsertImage = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        console.log("Selected image:", file)
        toast.success(`Selected image: ${file.name}`)
      }
    }
    input.click()
  }

  const handleDeleteEmail = () => {
    setEmailData({ to: "", cc: "", bcc: "", subject: "", body: "" })
    setShowCcBcc(false)
    setShowFormattingToolbar(false)
    setShowQuickReplyPrompt(false)
    closeEmailModal()
  }

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Loading all candidates...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 text-sm">Error loading candidates!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 font-['Inter',system-ui,sans-serif]">
      <div className="bg-gray-50 h-full">
        <div className="px-3 sm:px-4 lg:px-6">
          <DashboardHeader
            jobName="All Candidates Management"
            candidatesCount={candidates.length}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            showFilterPanel={showFilterPanel}
            setShowFilterPanel={setShowFilterPanel}
            filtersCount={filters.length}
            sortConfig={sortConfig}
            setSortConfig={setSortConfig}
            selectedCandidatesCount={selectedCandidates.size}
            onSendEmail={handleSendEmail}
          />
        </div>

        <div className="px-3 sm:px-4 lg:px-6 py-2">
          <BulkActionsBar
            selectedCount={selectedCandidates.size}
            availableTransitions={availableTransitions}
            onBulkStatusUpdate={handleBulkStatusUpdate}
            onBulkScan={handleBulkScan}
            onClearSelection={() => setSelectedCandidates(new Set())}
            isLoading={bulkUpdateStatusMutation.isLoading}
          />

          <CandidateTable
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            candidates={candidates}
            sortedCandidates={sortedCandidates}
            selectedCandidates={selectedCandidates}
            toggleSelectAll={toggleSelectAll}
            toggleCandidateSelection={toggleCandidateSelection}
            sortConfig={sortConfig}
            setSortConfig={setSortConfig}
            onStatusTransition={handleStatusTransition}
            onScanCandidate={handleScanCandidate}
            showJobName={true}
            refetchCandidates={refetch}
          />
        </div>
      </div>

      <FilterModal
        showFilterPanel={showFilterPanel}
        setShowFilterPanel={setShowFilterPanel}
        filters={filters}
        setFilters={setFilters}
        filterLogic={filterLogic}
        setFilterLogic={setFilterLogic}
      />

      <EmailModal
        emailModalState={emailModalState}
        setEmailModalState={setEmailModalState}
        emailData={emailData}
        setEmailData={setEmailData}
        showCcBcc={showCcBcc}
        setShowCcBcc={setShowCcBcc}
        showFormattingToolbar={showFormattingToolbar}
        setShowFormattingToolbar={setShowFormattingToolbar}
        textFormatting={textFormatting}
        setTextFormatting={setTextFormatting}
        showColorPicker={showColorPicker}
        setShowColorPicker={setShowColorPicker}
        showAlignmentMenu={showAlignmentMenu}
        setShowAlignmentMenu={setShowAlignmentMenu}
        showListMenu={showListMenu}
        setShowListMenu={setShowListMenu}
        undoStack={undoStack}
        setUndoStack={setUndoStack}
        redoStack={redoStack}
        setRedoStack={setRedoStack}
        showQuickReplyPrompt={showQuickReplyPrompt}
        setShowQuickReplyPrompt={setShowQuickReplyPrompt}
        quickReplyPrompt={quickReplyPrompt}
        setQuickReplyPrompt={setQuickReplyPrompt}
        isGeneratingContent={isGeneratingContent}
        onSendEmail={sendEmail}
        onCloseModal={closeEmailModal}
        onMinimizeModal={minimizeEmailModal}
        onMaximizeModal={maximizeEmailModal}
        onDeleteEmail={handleDeleteEmail}
        onGenerateContent={generateEmailContent}
        onAttachment={handleAttachment}
        onInsertLink={handleInsertLink}
        onInsertEmoji={handleInsertEmoji}
        onInsertImage={handleInsertImage}
      />

      {/* Status Confirmation Modal */}
      <ConfirmModal
        open={statusConfirmModal.isOpen}
        message={`Are you sure you want to change ${statusConfirmModal.candidateName}'s status from "${statusConfirmModal.currentStatus}" to "${statusConfirmModal.nextStatus}"?`}
        isLoading={bulkUpdateStatusMutation.isPending}
        onClose={handleStatusCancel}
        onConfirm={handleStatusConfirm}
      />
    </div>
  )
}