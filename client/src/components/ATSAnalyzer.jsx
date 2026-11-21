import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { BarChart3, CheckCircle2, Loader2, Sparkles, TriangleAlert } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../configs/api'

const ATSAnalyzer = ({ resumeData }) => {
  const { token } = useSelector((state) => state.auth)
  const [jobDescription, setJobDescription] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      toast.error('Please paste a job description to analyze the resume.')
      return
    }

    setIsAnalyzing(true)
    try {
      const { data } = await api.post(
        '/api/ai/analyze-ats',
        { resumeData, jobDescription },
        { headers: { Authorization: token } }
      )
      setAnalysis(data.analysis)
    } catch (error) {
      console.error(error)
      toast.error(error?.response?.data?.message || 'ATS analysis could not be completed right now.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-700">ATS Match Analyzer</p>
          <p className="text-xs text-slate-500">Compare your resume with a job description and get a recruiter-style score.</p>
        </div>
        <div className="rounded-full bg-gradient-to-br from-green-100 to-green-200 p-2 text-green-700">
          <BarChart3 className="size-4" />
        </div>
      </div>

      <textarea
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        placeholder="Paste the job description here..."
        className="min-h-28 w-full rounded-lg border border-gray-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none ring-0 transition focus:border-green-400"
      />

      <button
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-green-100 to-green-200 px-4 py-2 text-sm font-medium text-green-700 transition hover:ring-2 hover:ring-green-300 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isAnalyzing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        {isAnalyzing ? 'Analyzing...' : 'Analyze ATS Match'}
      </button>

      {analysis && (
        <div className="mt-4 space-y-4">
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">ATS Score</span>
              <span className="text-xl font-bold text-green-600">{analysis.ats_score}/100</span>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-white p-2">
                <p className="text-xs text-slate-500">Keyword Match</p>
                <p className="text-sm font-semibold text-slate-700">{analysis.score_breakdown?.keyword_match || 0}/40</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-2">
                <p className="text-xs text-slate-500">Skills Match</p>
                <p className="text-sm font-semibold text-slate-700">{analysis.score_breakdown?.skills_match || 0}/30</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-2">
                <p className="text-xs text-slate-500">Experience Match</p>
                <p className="text-sm font-semibold text-slate-700">{analysis.score_breakdown?.experience_match || 0}/20</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-2">
                <p className="text-xs text-slate-500">Format Quality</p>
                <p className="text-sm font-semibold text-slate-700">{analysis.score_breakdown?.format_quality || 0}/10</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <CheckCircle2 className="size-4 text-green-600" />
              Matched Keywords
            </div>
            <div className="flex flex-wrap gap-2">
              {(analysis.matched_keywords || []).map((keyword) => (
                <span key={keyword} className="rounded-full bg-green-100 px-2.5 py-1 text-xs text-green-700">
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <TriangleAlert className="size-4 text-amber-600" />
              Missing Keywords
            </div>
            <div className="flex flex-wrap gap-2">
              {(analysis.missing_keywords || []).map((keyword) => (
                <span key={keyword} className="rounded-full bg-amber-100 px-2.5 py-1 text-xs text-amber-700">
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-3">
            <p className="mb-2 text-sm font-semibold text-slate-700">Suggested Changes</p>
            <div className="space-y-2">
              {(analysis.changes_needed || []).map((item, index) => (
                <div key={`${item.section}-${index}`} className="rounded-lg bg-slate-50 p-2 text-sm text-slate-600">
                  <p className="font-medium text-slate-700">{item.section}</p>
                  <p>{item.issue}</p>
                  <p className="mt-1 text-xs text-slate-500">Fix: {item.fix}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-3">
            <p className="mb-2 text-sm font-semibold text-slate-700">Strengths</p>
            <ul className="space-y-1 text-sm text-slate-600">
              {(analysis.strengths || []).map((strength) => (
                <li key={strength} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-green-500" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-gray-200 bg-slate-50 p-3 text-sm text-slate-600">
            <p className="font-semibold text-slate-700">Overall Feedback</p>
            <p className="mt-1 leading-6">{analysis.overall_feedback}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ATSAnalyzer
