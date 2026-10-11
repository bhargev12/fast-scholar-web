import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, BookOpen, Download, Filter, FileText, 
  FileCode, FileImage, File, AlertCircle,
  Code, Archive, GraduationCap, Layers, Loader2, ChevronRight
} from 'lucide-react';

const getFileIcon = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  if (['pdf', 'docx', 'doc', 'txt', 'rtf', 'pptx', 'ppt'].includes(ext)) return <FileText className="w-5 h-5 text-red-500" />;
  if (['cpp', 'c', 'py', 'js', 'html', 'css', 'sql', 'java', 'ipynb'].includes(ext)) return <FileCode className="w-5 h-5 text-blue-500" />;
  if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) return <FileImage className="w-5 h-5 text-green-500" />;
  if (['zip', 'rar', '7z', 'tar'].includes(ext)) return <Archive className="w-5 h-5 text-yellow-600" />;
  return <File className="w-5 h-5 text-slate-500" />;
};

const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDisplayName = (str) => {
  if (!str) return 'Unknown';
  let name = str.replace(/\.[^/.]+$/, ""); 
  return name.replace(/[-_]/g, ' '); 
};

const cleanCategoryName = (str) => {
  if (!str) return 'General';
  return str.replace(/[-_]/g, ' ');
};

const REPO_OWNER = 'MuxammilSidd';
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const FALLBACK_DATA = [
  { path: 'Programming Fundamentals/Past Papers/PF_Midterm_Fall2023.pdf', size: 1048576 },
  { path: 'Programming Fundamentals/Notes/Pointers_and_Arrays.pdf', size: 512000 },
  { path: 'Calculus and Analytical Geometry/Assignments/Assignment_1_Limits.pdf', size: 840000 },
  { path: 'Applied Physics/Past Papers/Physics_Final_Spring2023.pdf', size: 1200000 },
];

export default function App() {
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedType, setSelectedType] = useState('All');

  useEffect(() => {
    const fetchSemesterFiles = async () => {
      setIsLoading(true);
      setError(null);
      setIsUsingFallback(false);
      setSearchTerm('');
      setSelectedSubject('All');
      setSelectedType('All');

      const repoName = `FAST-KHI-Semester-${selectedSemester}`;

      try {
        let url = `https://api.github.com/repos/${REPO_OWNER}/${repoName}/git/trees/main?recursive=1`;
        let response = await fetch(url);

        if (response.status === 404) {
          url = `https://api.github.com/repos/${REPO_OWNER}/${repoName}/git/trees/master?recursive=1`;
          response = await fetch(url);
        }

        if (!response.ok) {
          throw new Error(`GitHub API Error: ${response.status}`);
        }

        const data = await response.json();
        
        const files = data.tree.filter(item => 
          item.type === 'blob' && 
          !item.path.startsWith('.') && 
          !item.path.toLowerCase().includes('readme.md')
        );

        const parsedResources = files.map((file) => {
          const parts = file.path.split('/');
          const filename = parts.pop();
          
          let subject = 'General';
          let type = 'Misc';
          
          if (parts.length >= 2) {
            subject = cleanCategoryName(parts[0]);
            type = cleanCategoryName(parts[1]);
          } else if (parts.length === 1) {
            subject = cleanCategoryName(parts[0]);
          }

          return {
            id: file.path, 
            name: formatDisplayName(filename),
            originalName: filename,
            path: file.path,
            subject: subject,
            type: type,
            size: file.size,
            url: `https://raw.githubusercontent.com/${REPO_OWNER}/${repoName}/main/${encodeURI(file.path)}`
          };
        });

        setResources(parsedResources);

      } catch (err) {
        console.warn('Using fallback data:', err.message);
        setError(err.message);
        setIsUsingFallback(true);
        
        const mappedFallback = FALLBACK_DATA.map((file) => {
          const parts = file.path.split('/');
          const filename = parts.pop();
          return {
            id: file.path,
            name: formatDisplayName(filename),
            originalName: filename,
            path: file.path,
            subject: cleanCategoryName(parts[0] || 'General'),
            type: cleanCategoryName(parts[1] || 'Misc'),
            size: file.size,
            url: '#'
          };
        });
        setResources(mappedFallback);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSemesterFiles();
  }, [selectedSemester]);

  const { filteredResources, subjects, types } = useMemo(() => {
    const uniqueSubjects = ['All', ...new Set(resources.map(r => r.subject))].sort();
    const uniqueTypes = ['All', ...new Set(resources.map(r => r.type))].sort();

    const filtered = resources.filter(res => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = res.name.toLowerCase().includes(searchLower) || 
                            res.subject.toLowerCase().includes(searchLower) ||
                            res.originalName.toLowerCase().includes(searchLower);
      const matchesSubject = selectedSubject === 'All' || res.subject === selectedSubject;
      const matchesType = selectedType === 'All' || res.type === selectedType;
      
      return matchesSearch && matchesSubject && matchesType;
    });

    return { filteredResources: filtered, subjects: uniqueSubjects, types: uniqueTypes };
  }, [resources, searchTerm, selectedSubject, selectedType]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500/30 selection:text-indigo-900">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between h-auto sm:h-20 py-4 sm:py-0 items-center gap-4">
            <div 
              className="flex items-center gap-3 flex-shrink-0 cursor-pointer group" 
              onClick={() => {
                setSearchTerm(''); 
                setSelectedSubject('All'); 
                setSelectedType('All');
              }}
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-900 to-indigo-600 flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/25 transition-all">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                  FAST Scholar
                </span>
                <span className="text-xs font-semibold text-indigo-600 tracking-wider uppercase">
                  NUCES Resource Hub
                </span>
              </div>
            </div>
            
            <div className="flex-grow w-full max-w-2xl relative group">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-600 transition-colors" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search past papers, notes, books, code..." 
                className="w-full pl-12 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
              />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-72 flex-shrink-0 space-y-6">
          {isUsingFallback && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 shadow-sm">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-bold text-amber-900">GitHub API Limited</h4>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Displaying cached fallback data. Please wait an hour to access live repository data.
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" /> Select Semester
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {SEMESTERS.map(sem => (
                <button
                  key={sem}
                  onClick={() => setSelectedSemester(sem)}
                  className={`flex items-center justify-center py-2.5 rounded-xl text-sm font-bold transition-all border ${
                    selectedSemester === sem 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' 
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {sem}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" /> Subjects
            </h3>
            <div className="space-y-1 max-h-64 overflow-y-auto pr-2">
              {subjects.map(subject => (
                <button
                  key={subject}
                  onClick={() => setSelectedSubject(subject)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-between ${
                    selectedSubject === subject 
                      ? 'bg-indigo-50 text-indigo-700' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate pr-2">{subject}</span>
                  {selectedSubject === subject && <ChevronRight className="w-4 h-4 opacity-70" />}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-500" /> Resource Type
            </h3>
            <div className="space-y-1 max-h-64 overflow-y-auto pr-2">
              {types.map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-between ${
                    selectedType === type 
                      ? 'bg-slate-900 text-white' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate pr-2">{type}</span>
                  {selectedType === type && <ChevronRight className="w-4 h-4 opacity-70" />}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-grow min-w-0 flex flex-col">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {searchTerm ? `Results for "${searchTerm}"` : selectedSubject === 'All' ? `Semester ${selectedSemester} Resources` : selectedSubject}
              </h2>
              <p className="text-sm font-medium text-slate-500 mt-1">
                Extracted from FAST-KHI-Semester-{selectedSemester} repository
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl">
                {filteredResources.length} items found
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex-grow flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200 border-dashed">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
              <h3 className="text-lg font-bold text-slate-900">Fetching Academic Archives</h3>
              <p className="text-sm text-slate-500 mt-1">Pulling the latest materials from GitHub...</p>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="flex-grow bg-white border border-slate-200 border-dashed rounded-3xl p-16 text-center flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-5 border border-slate-100">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No resources found</h3>
              <p className="text-slate-500 max-w-md">
                We couldn't find anything matching your filters in Semester {selectedSemester}.
              </p>
              <button 
                onClick={() => {setSearchTerm(''); setSelectedSubject('All'); setSelectedType('All');}}
                className="mt-6 px-6 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 content-start">
              {filteredResources.map((file) => (
                <div 
                  key={file.id} 
                  className="bg-white border border-slate-200 rounded-3xl p-5 hover:border-indigo-400 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex gap-4 items-start mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-50 transition-colors">
                        {getFileIcon(file.originalName)}
                      </div>
                      
                      <div className="flex-grow min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 mb-1.5 line-clamp-2 leading-snug group-hover:text-indigo-700 transition-colors" title={file.originalName}>
                          {file.name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-slate-500">
                          <span className="flex items-center gap-1 max-w-full" title={file.subject}>
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                            <span className="truncate">{file.subject}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6 flex flex-wrap gap-2">
                      <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-lg truncate max-w-full uppercase tracking-wider">
                        {file.type}
                      </span>
                      <span className="bg-slate-50 text-slate-500 border border-slate-100 text-[11px] font-bold px-2.5 py-1 rounded-lg">
                        {formatSize(file.size)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <a 
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-900 text-slate-700 hover:text-white rounded-xl text-sm font-bold transition-all"
                    >
                      <Download className="w-4 h-4" /> View & Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <footer className="bg-white border-t border-slate-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
            <div className="w-8 h-8 rounded-lg bg-indigo-900 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">FAST Scholar Hub</p>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Powered by GitHub API • Developed for NUCES Karachi
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <a 
              href="https://github.com/bhargev12"
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors bg-slate-50 px-4 py-2 rounded-xl hover:bg-indigo-50"
            >
              <Code className="w-4 h-4" /> Organization Hub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}