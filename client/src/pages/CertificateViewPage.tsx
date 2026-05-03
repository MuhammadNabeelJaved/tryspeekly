import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Certificate } from '@phosphor-icons/react'
import { MOCK_ENROLLED_COURSES, MOCK_STUDENT } from './student/studentData'

export default function CertificateViewPage() {
  const { id } = useParams()
  
  // In a real application, this would be an API call fetching certificate details by ID
  const course = MOCK_ENROLLED_COURSES.find(c => c.certificateId === id)

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <Certificate size={64} className="text-slate-300 mb-4" />
        <h1 className="text-2xl font-black text-slate-900 mb-2">Certificate Not Found</h1>
        <p className="text-slate-500 mb-6">The certificate ID you entered is invalid or the certificate does not exist.</p>
        <Link to="/" className="bg-violet-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-md">
          Go to Homepage
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4 sm:px-8 font-sans">
      <div className="w-full max-w-5xl mb-6 flex justify-between items-center">
        <Link to="/dashboard/certificates" className="flex items-center gap-2 text-slate-500 hover:text-violet-600 transition-colors font-semibold bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
          <ArrowLeft size={18} />
          Back to Certificates
        </Link>
        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg font-bold shadow-sm border border-green-200">
          <CheckCircle size={20} weight="fill" />
          Officially Verified
        </div>
      </div>

      {/* Main Container - Two Columns */}
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: The Certificate Itself (Takes up 2/3 space on large screens) */}
        <div className="lg:col-span-2">
          <div className="w-full bg-white p-6 sm:p-10 relative shadow-xl overflow-hidden border border-slate-200 aspect-[4/3] flex flex-col justify-center">
            {/* Certificate Outer Border */}
            <div className="absolute inset-4 border-[8px] border-[#1e1b4b] pointer-events-none"></div>
            {/* Certificate Inner Border */}
            <div className="absolute inset-[20px] border-[2px] border-[#c4b5fd] pointer-events-none"></div>

            {/* Content */}
            <div className="relative z-10 text-center flex flex-col items-center h-full justify-center">
              <h2 className="text-[#7c3aed] text-lg sm:text-xl font-black tracking-[0.2em] mb-4">ENGLISHPRO ACADEMY</h2>
              
              <h1 className="text-[#1e1b4b] text-3xl sm:text-4xl font-serif font-bold italic mb-4 leading-tight">Certificate of Completion</h1>
              
              <p className="text-slate-500 text-sm sm:text-base mb-4 font-medium">This is proudly presented to</p>
              
              <p className="text-[#7c3aed] text-3xl sm:text-4xl font-serif font-bold italic mb-6 border-b-2 border-slate-200 pb-2 px-8 inline-block">
                {MOCK_STUDENT.name}
              </p>
              
              <p className="text-slate-500 text-sm sm:text-base mb-4 font-medium">for successfully completing the course</p>
              
              <p className="text-[#1e1b4b] text-xl sm:text-2xl font-bold mb-10 max-w-[80%] leading-snug mx-auto">
                {course.title}
              </p>
              
              <div className="flex justify-between w-full px-12 mt-auto">
                <div className="text-center">
                  <div className="border-b-2 border-slate-300 w-32 sm:w-40 mx-auto mb-2"></div>
                  <p className="text-slate-500 font-bold text-xs">Date: {new Date(course.issueDate!).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                
                <div className="text-center">
                  <div className="border-b-2 border-slate-300 w-32 sm:w-40 mx-auto mb-2"></div>
                  <p className="text-slate-500 font-bold text-xs">ID: {course.certificateId}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Course & Certificate Details */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900">Certificate Details</h3>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-1">Recipient</p>
                <p className="font-bold text-slate-900">{MOCK_STUDENT.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-1">Issue Date</p>
                <p className="font-bold text-slate-900">{new Date(course.issueDate!).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-1">Credential ID</p>
                <p className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded w-fit">{course.certificateId}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-violet-50">
              <h3 className="font-bold text-slate-900">Course Information</h3>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-1">Course Name</p>
                <p className="font-bold text-slate-900 leading-tight">{course.title}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-1">Course Level</p>
                <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-md">
                  {course.level}
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-1">Instructor</p>
                <p className="font-bold text-slate-900">{course.instructorName}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
             <h3 className="font-bold text-slate-900 mb-2">Share this achievement</h3>
             <p className="text-xs text-slate-500 mb-4">Anyone with this link can view this verified certificate.</p>
             <input 
               type="text" 
               readOnly 
               value={`https://englishpro.com/certificate/${course.certificateId}`} 
               className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none mb-3 font-mono text-slate-600"
             />
             <button 
               onClick={() => {
                 navigator.clipboard.writeText(`https://englishpro.com/certificate/${course.certificateId}`)
                 alert('Link copied to clipboard!')
               }}
               className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl transition-colors text-sm"
             >
               Copy Link
             </button>
          </div>

        </div>

      </div>
    </div>
  )
}