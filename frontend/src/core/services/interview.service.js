import axios from 'axios'
import axiosClient from '@/core/services/axios-client'
import config from '@/core/configs'

export const interviewApi = {
  createSessionFromResume: ({ file, candidate, job, analysis }) => {
    const formData = new FormData()
    formData.append('resume_file', file)
    formData.append('candidate', JSON.stringify(candidate || {}))
    formData.append('job', JSON.stringify(job || {}))
    formData.append('analysis', JSON.stringify(analysis || {}))

    return axios.post(`${config.baseUrl}/interview-sessions/from-resume`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(response => response.data)
  },

  getSession: sessionId => axiosClient.get(`/interview-sessions/${sessionId}`),

  getHistory: () => axiosClient.get('/interview-sessions/history'),

  sendTurn: (sessionId, message, metadata = {}) => axiosClient.post(`/interview-sessions/${sessionId}/turn`, {
    message,
    metadata,
  }),

  recordEvent: (sessionId, event) => axiosClient.post(`/interview-sessions/${sessionId}/events`, event),

  finishSession: sessionId => axiosClient.post(`/interview-sessions/${sessionId}/finish`),
}
