import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const AgentCard = ({ title, data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const scoreColor = data.matching_score >= 80 ? 'text-green-500' : 
                     data.matching_score >= 50 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {data.matching_score !== null && (
          <div className={`text-xl font-bold ${scoreColor}`}>
            {data.matching_score}%
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Analysis */}
        <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
          <p className="font-medium mb-1 text-gray-700">Analysis:</p>
          {typeof data.analysis === 'string' ? data.analysis : JSON.stringify(data.analysis)}
        </div>

        {/* Reasoning */}
        {data.reasoning && (
          <div className="text-xs text-gray-500 italic border-l-2 border-blue-200 pl-3">
            "{data.reasoning}"
          </div>
        )}

        {/* Extracted Data Preview (Collapsible could be better, but simple for now) */}
        <div className="mt-2">
           <details className="group">
             <summary className="cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center">
                <span>View Extracted Data</span>
                <span className="ml-1 transition-transform group-open:rotate-180">▼</span>
             </summary>
             <div className="mt-2 p-2 bg-gray-900 text-gray-100 rounded text-xs font-mono overflow-auto max-h-40">
               <pre>{JSON.stringify(data.extracted_data, null, 2)}</pre>
             </div>
           </details>
        </div>
      </div>
    </div>
  );
};

const CVScanner = () => {
    const [file, setFile] = useState(null);
    const [jobDescription, setJobDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleScan = async () => {
        if (!file && !jobDescription) {
            setError("Please provide a CV file and Job Description.");
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        const formData = new FormData();
        if (file) formData.append('cv_file', file);
        formData.append('job_description', jobDescription);

        try {
            const response = await fetch('http://localhost:5000/scan-cv', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to scan CV");
            }

            setResult(data);
        } catch (err) {
            console.error("Scan error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-900">
            <header className="max-w-7xl mx-auto mb-10 flex justify-between items-center">
                <div>
                     <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                    AI Multi-Agent CV Scanner
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Powered by Gemini 1.5 Flash • Specialized Agents Team
                    </p>
                </div>
                <Link to="/" className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                    Back to Home
                </Link>
            </header>

            <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Input Section */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">1</span>
                            Upload Candidate CV
                        </h2>
                        
                        <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors bg-gray-50 group">
                            <input 
                                type="file" 
                                accept=".pdf,.png,.jpg,.jpeg,.txt"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="space-y-2 pointer-events-none">
                                <span className="text-4xl">📄</span>
                                <p className="text-sm text-gray-600 font-medium">
                                    {file ? file.name : "Drop PDF or Image here"}
                                </p>
                                <p className="text-xs text-gray-400">or click to browse</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm">2</span>
                            Job Description
                        </h2>
                        <textarea
                            className="w-full h-48 p-4 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                            placeholder="Paste the Job Description here to enable matching analysis..."
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                        ></textarea>
                    </div>

                    <button
                        onClick={handleScan}
                        disabled={loading || (!file && !jobDescription)}
                        className={`w-full py-4 px-6 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2
                            ${loading 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl'
                            }`}
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Agents Working...
                            </>
                        ) : (
                            <>
                                🚀 Start Analysis
                            </>
                        )}
                    </button>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-start gap-2">
                             <span>⚠️</span>
                             {error}
                        </div>
                    )}
                </div>

                {/* Results Section */}
                <div className="lg:col-span-8 space-y-8">
                     {!result && !loading && (
                         <div className="h-full flex flex-col items-center justify-center text-gray-400 min-h-[400px] border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                             <span className="text-6xl mb-4">🤖</span>
                             <p className="text-lg font-medium">Ready to deploy Multi-Agent System</p>
                             <p className="text-sm">Upload a CV to see the agents in action</p>
                         </div>
                     )}

                     {result && (
                         <>
                            {/* Master Summary */}
                            <div className="bg-white p-8 rounded-3xl shadow-lg border border-purple-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <span className="text-9xl">👑</span>
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl shadow-lg shadow-purple-200">
                                            👑
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">Master Agent Assessment</h2>
                                            <div className="flex gap-2 mt-1">
                                                <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold uppercase rounded-full tracking-wide">
                                                    Synthesized Report
                                                </span>
                                                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold uppercase rounded-full tracking-wide">
                                                    {result.metadata.model_used}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                        <div className="p-4 bg-gray-50 rounded-xl text-center border border-gray-100">
                                            <div className="text-sm text-gray-500 mb-1">Final Matching Score</div>
                                            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-purple-600">
                                                {result.final_assessment.final_matching_score}%
                                            </div>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-xl text-center border border-gray-100">
                                            <div className="text-sm text-gray-500 mb-1">Recommendation</div>
                                            <div className="text-xl font-bold text-gray-800">
                                                {result.final_assessment.hiring_recommendation}
                                            </div>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-xl text-center border border-gray-100">
                                            <div className="text-sm text-gray-500 mb-1">Consistency Check</div>
                                            <div className={`text-xl font-bold ${result.final_assessment.consistency_check.includes("Pass") ? "text-green-600" : "text-amber-600"}`}>
                                                {result.final_assessment.consistency_check}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-2">Executive Summary</h3>
                                            <p className="text-gray-600 leading-relaxed">
                                                {result.final_assessment.candidate_summary}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <h3 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                                                    <span>✅</span> Key Strengths
                                                </h3>
                                                <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                                                    {result.final_assessment.key_strengths.map((s, i) => (
                                                        <li key={i}>{s}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                                                    <span>🚩</span> Gaps / Concerns
                                                </h3>
                                                <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                                                    {result.final_assessment.key_gaps.map((g, i) => (
                                                        <li key={i}>{g}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="bg-purple-50 p-4 rounded-xl text-sm text-purple-900 border border-purple-100">
                                            <strong>Master Logic:</strong> {result.final_assessment.logic_explanation}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Agents Grid */}
                             <div>
                                <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                                    <span>🧩</span> Specialized Agent Reports
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <AgentCard 
                                        title="👤 Personal Info Agent" 
                                        data={result.detailed_agent_reports.personal_info} 
                                    />
                                    <AgentCard 
                                        title="🎓 Education Agent" 
                                        data={result.detailed_agent_reports.education} 
                                    />
                                    <AgentCard 
                                        title="💼 Experience Agent" 
                                        data={result.detailed_agent_reports.experience} 
                                    />
                                    <AgentCard 
                                        title="⚒️ Skills Agent" 
                                        data={result.detailed_agent_reports.skills} 
                                    />
                                    <AgentCard 
                                        title="🚀 Projects Agent" 
                                        data={result.detailed_agent_reports.projects} 
                                    />
                                </div>
                            </div>
                         </>
                     )}
                </div>
            </main>
        </div>
    );
};

export default CVScanner;
