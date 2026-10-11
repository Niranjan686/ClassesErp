import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud, File, Download, Trash2, Pause, Play, X,
  CheckCircle2, AlertCircle, RefreshCw, HardDrive, Search,
  Filter, FileCode, Archive, Database, ArrowUpDown, Copy, ExternalLink, ShieldCheck
} from 'lucide-react';
import api, { API_BASE_URL } from '../../api';

// Helper: Format bytes to human readable string
const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

// Helper: Get icon based on file extension
const getFileIcon = (ext) => {
  const cleanExt = (ext || '').toLowerCase().replace('.', '');
  if (['sln', 'cs', 'js', 'jsx', 'ts', 'tsx', 'cpp', 'py', 'java', 'html', 'css'].includes(cleanExt)) {
    return <FileCode className="w-5 h-5 text-indigo-600" />;
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(cleanExt)) {
    return <Archive className="w-5 h-5 text-amber-600" />;
  }
  if (['sql', 'db', 'sqlite', 'bak'].includes(cleanExt)) {
    return <Database className="w-5 h-5 text-emerald-600" />;
  }
  return <File className="w-5 h-5 text-blue-600" />;
};

const FileVaultManager = () => {
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState({ totalFiles: 0, totalStorageBytes: 0, totalDownloads: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedExt, setSelectedExt] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Upload Configuration & State
  const [chunkSizeMB, setChunkSizeMB] = useState(2); // 2MB default per chunk (prevents any timeout)
  const [uploadFormat, setUploadFormat] = useState('binary'); // 'binary' | 'base64'
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDescription, setFileDescription] = useState('');
  
  // Active Upload State Machine
  const [uploading, setUploading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState('');
  const [etaTime, setEtaTime] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // References for pause/cancel controls across async chunk loops
  const pauseRef = useRef(false);
  const cancelRef = useRef(false);
  const activeUploadIdRef = useRef(null);
  const fileInputRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // Fetch all Vault files
  const fetchVaultFiles = async () => {
    try {
      setLoading(true);
      const res = await api.get('/vault/files', {
        params: { search: search || undefined, extension: selectedExt || undefined }
      });
      if (res.data.success) {
        setFiles(res.data.files || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fetch vault files.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVaultFiles();
  }, [search, selectedExt]);

  // Handle Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  // Helper: Convert File/Blob slice to Base64 string
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Start / Resume Chunked Upload
  const startChunkedUpload = async () => {
    if (!selectedFile) return;

    const file = selectedFile;
    const chunkSize = chunkSizeMB * 1024 * 1024; // in bytes
    const calculatedTotalChunks = Math.ceil(file.size / chunkSize);
    const uploadId = activeUploadIdRef.current || `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    activeUploadIdRef.current = uploadId;

    setUploading(true);
    setIsPaused(false);
    pauseRef.current = false;
    cancelRef.current = false;
    setTotalChunks(calculatedTotalChunks);

    let startChunkIndex = currentChunk;
    const uploadStartTime = Date.now();
    let uploadedBytesTotal = startChunkIndex * chunkSize;

    showToast(`Uploading '${file.name}' in ${calculatedTotalChunks} chunks (${chunkSizeMB}MB each) to prevent connection timeouts!`, 'info');

    try {
      for (let i = startChunkIndex; i < calculatedTotalChunks; i++) {
        // Check if user clicked Cancel
        if (cancelRef.current) {
          await api.post('/vault/cancel-upload', { uploadId }).catch(() => {});
          resetUploadState();
          showToast('Upload cancelled and temporary chunks cleaned.', 'info');
          return;
        }

        // Check if user clicked Pause
        if (pauseRef.current) {
          setIsPaused(true);
          return;
        }

        setCurrentChunk(i + 1);
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunkBlob = file.slice(start, end);
        const chunkBytes = end - start;

        // Prepare chunk payload (Multipart FormData or Base64 JSON)
        const chunkStartTime = Date.now();
        let uploadAttempt = 0;
        let chunkSuccess = false;

        // Retry loop for bulletproof resilience against any network jitter (up to 3 retries per chunk)
        while (!chunkSuccess && uploadAttempt < 3) {
          try {
            uploadAttempt++;
            
            if (uploadFormat === 'base64') {
              const base64Data = await blobToBase64(chunkBlob);
              const payload = {
                uploadId,
                fileName: file.name,
                fileSize: file.size,
                chunkIndex: i,
                totalChunks: calculatedTotalChunks,
                chunkBase64: base64Data,
                format: 'base64',
                description: fileDescription,
              };
              await api.post('/vault/chunk-upload', payload);
            } else {
              const formData = new FormData();
              formData.append('uploadId', uploadId);
              formData.append('fileName', file.name);
              formData.append('fileSize', file.size);
              formData.append('chunkIndex', i);
              formData.append('totalChunks', calculatedTotalChunks);
              formData.append('format', 'binary');
              formData.append('description', fileDescription);
              formData.append('chunkFile', chunkBlob, `${file.name}.part${i}`);

              await api.post('/vault/chunk-upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
              });
            }

            chunkSuccess = true;
          } catch (retryErr) {
            console.warn(`Chunk ${i + 1} attempt ${uploadAttempt} failed:`, retryErr.message);
            if (uploadAttempt >= 3) {
              throw new Error(`Failed to upload chunk ${i + 1} after 3 attempts: ${retryErr.message}`);
            }
            await new Promise((res) => setTimeout(res, 1000)); // Wait 1 sec before retrying
          }
        }

        uploadedBytesTotal += chunkBytes;
        const percent = Math.min(Math.round((uploadedBytesTotal / file.size) * 100), 100);
        setUploadProgress(percent);

        // Calculate real-time speed & ETA
        const elapsedSecs = (Date.now() - uploadStartTime) / 1000;
        if (elapsedSecs > 0) {
          const bytesPerSec = (uploadedBytesTotal - (startChunkIndex * chunkSize)) / elapsedSecs;
          setUploadSpeed(`${formatBytes(bytesPerSec)}/s`);
          
          const remainingBytes = file.size - uploadedBytesTotal;
          const remainingSecs = Math.round(remainingBytes / (bytesPerSec || 1));
          setEtaTime(remainingSecs > 0 ? `${remainingSecs}s remaining` : 'Finalizing...');
        }
      }

      // Complete!
      showToast(`'${file.name}' (${formatBytes(file.size)}) uploaded and assembled successfully!`, 'success');
      resetUploadState();
      fetchVaultFiles();
    } catch (err) {
      console.error('Upload Error:', err);
      showToast(err.message || 'Error occurred during chunk upload.', 'error');
      setUploading(false);
    }
  };

  const handlePause = () => {
    pauseRef.current = true;
    setIsPaused(true);
    showToast('Upload paused. You can resume at any time.', 'info');
  };

  const handleResume = () => {
    pauseRef.current = false;
    setIsPaused(false);
    startChunkedUpload();
  };

  const handleCancel = () => {
    cancelRef.current = true;
    setUploading(false);
  };

  const resetUploadState = () => {
    setUploading(false);
    setIsPaused(false);
    setSelectedFile(null);
    setFileDescription('');
    setUploadProgress(0);
    setCurrentChunk(0);
    setTotalChunks(0);
    setUploadSpeed('');
    setEtaTime('');
    activeUploadIdRef.current = null;
    pauseRef.current = false;
    cancelRef.current = false;
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Download Trigger
  const handleDownload = (file) => {
    const token = localStorage.getItem('token');
    const downloadUrl = `${API_BASE_URL}/vault/download/${file._id}?token=${encodeURIComponent(token)}`;
    
    // Create temporary link element and click to stream
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', file.fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Downloading '${file.fileName}'...`, 'info');
    setTimeout(() => {
      fetchVaultFiles(); // Refresh download count
    }, 2000);
  };

  // Delete file
  const handleDelete = async (file) => {
    if (!window.confirm(`Are you sure you want to permanently delete '${file.fileName}' from the Vault?`)) {
      return;
    }
    try {
      const res = await api.delete(`/vault/files/${file._id}`);
      if (res.data.success) {
        showToast(`'${file.fileName}' deleted successfully.`, 'success');
        fetchVaultFiles();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete file.', 'error');
    }
  };

  const copyDownloadUrl = (file) => {
    const token = localStorage.getItem('token');
    const url = `${API_BASE_URL}/vault/download/${file._id}?token=${encodeURIComponent(token)}`;
    navigator.clipboard.writeText(url);
    showToast('Direct download URL copied to clipboard!', 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-sm font-bold transition-all transform animate-bounce ${
          toast.type === 'error'
            ? 'bg-rose-50 text-rose-800 border-rose-200'
            : toast.type === 'info'
            ? 'bg-blue-50 text-blue-800 border-blue-200'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-rose-600" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-indigo-900/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> SuperAdmin File Vault
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Zero Connection Timeout
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Chunked High-Capacity File Vault
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Upload and store files of <b>any size</b> (including large <code>.net sln</code> visual studio solution archives, database backups, ISOs, and software distributions). Files are automatically sliced into small chunks, preventing any HTTP timeout during upload.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchVaultFiles}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/10 text-xs font-bold transition-all shadow-sm flex items-center gap-2"
              title="Refresh Vault"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        {/* Storage Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Vault Files</span>
            <p className="text-2xl font-black text-white mt-1">{stats.totalFiles}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cloud Storage Consumed</span>
            <p className="text-2xl font-black text-cyan-300 mt-1">{formatBytes(stats.totalStorageBytes)}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Downloads Served</span>
            <p className="text-2xl font-black text-emerald-300 mt-1">{stats.totalDownloads} downloads</p>
          </div>
        </div>
      </div>

      {/* Main Upload Control Panel */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-indigo-600" />
              Upload New File (Chunked Engine)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select or drop any file of any size. Slices into safe bite-sized chunks to ensure zero timeouts.
            </p>
          </div>

          {/* Config Controls: Chunk Size & Format */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <span>Chunk Size:</span>
              <select
                value={chunkSizeMB}
                disabled={uploading}
                onChange={(e) => setChunkSizeMB(Number(e.target.value))}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value={1}>1 MB (Ultra-slow connections)</option>
                <option value={2}>2 MB (Recommended Default)</option>
                <option value={4}>4 MB (Broadband)</option>
                <option value={8}>8 MB (High-Speed Fiber)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <span>Transfer Format:</span>
              <select
                value={uploadFormat}
                disabled={uploading}
                onChange={(e) => setUploadFormat(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="binary">Binary Multipart (Fastest)</option>
                <option value="base64">Base64 Encoded (Safe Text)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Drag & Drop Target Box */}
        {!selectedFile ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-indigo-600 bg-indigo-50/60 scale-[1.01]'
                : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/70'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])}
              className="hidden"
            />
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h4 className="text-base font-black text-slate-900 mb-1">
              Choose or drag & drop a file here
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Supports any file format: <b>.NET .sln solution archives, .zip, .rar, .iso, .exe, .pdf, .sql, video lectures</b>. No hard file size limits.
            </p>
          </div>
        ) : (
          /* File Selected & Upload Progress Panel */
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                  {getFileIcon(selectedFile.name.split('.').pop())}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 break-all">{selectedFile.name}</h4>
                  <p className="text-xs text-slate-500 font-semibold">
                    Size: <b>{formatBytes(selectedFile.size)}</b> • Est. Chunks: <b>{Math.ceil(selectedFile.size / (chunkSizeMB * 1024 * 1024))}</b> ({chunkSizeMB}MB/chunk)
                  </p>
                </div>
              </div>

              {!uploading && (
                <button
                  onClick={resetUploadState}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors self-end sm:self-center"
                  title="Remove selected file"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Optional Description */}
            {!uploading && (
              <div>
                <input
                  type="text"
                  placeholder="Optional description (e.g. .NET Core 8 Backend Solution backup, Q3 Student Records)"
                  value={fileDescription}
                  onChange={(e) => setFileDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Active Progress Bar & Counters */}
            {uploading && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
                    Uploading: Chunk {currentChunk} of {totalChunks}
                  </span>
                  <span className="font-mono text-indigo-600">{uploadProgress}%</span>
                </div>

                {/* Progress Track */}
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300 shadow-sm"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>Speed: <b className="text-slate-800">{uploadSpeed || 'Calculating...'}</b></span>
                  <span>Format: <b className="uppercase text-slate-800">{uploadFormat}</b></span>
                  <span>ETA: <b className="text-slate-800">{etaTime || 'Calculating...'}</b></span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              {!uploading ? (
                <button
                  onClick={startChunkedUpload}
                  className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all transform hover:scale-105"
                >
                  <UploadCloud className="w-4 h-4" /> Start Chunked Upload
                </button>
              ) : (
                <>
                  {isPaused ? (
                    <button
                      onClick={handleResume}
                      className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-all"
                    >
                      <Play className="w-4 h-4" /> Resume Upload
                    </button>
                  ) : (
                    <button
                      onClick={handlePause}
                      className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-2 transition-all"
                    >
                      <Pause className="w-4 h-4" /> Pause Upload
                    </button>
                  )}

                  <button
                    onClick={handleCancel}
                    className="px-5 py-2.5 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-xs flex items-center gap-2 transition-all"
                  >
                    <X className="w-4 h-4" /> Cancel Upload
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* File Vault Listing Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Search & Filter Header */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-indigo-600" />
              Stored Vault Files ({files.length})
            </h3>
            <p className="text-xs text-slate-500">
              Direct stream download available for any file size with automatic resume support.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search file name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 w-44 sm:w-56"
              />
            </div>

            {/* Filter by Extension */}
            <select
              value={selectedExt}
              onChange={(e) => setSelectedExt(e.target.value)}
              className="px-3 py-2 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Types</option>
              <option value=".sln">.sln (Visual Studio)</option>
              <option value=".zip">.zip (Archive)</option>
              <option value=".rar">.rar</option>
              <option value=".pdf">.pdf (Documents)</option>
              <option value=".sql">.sql (Database)</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-6">File Name & Type</th>
                <th className="py-3.5 px-6">Size</th>
                <th className="py-3.5 px-6">Uploaded By</th>
                <th className="py-3.5 px-6">Chunks</th>
                <th className="py-3.5 px-6">Downloads</th>
                <th className="py-3.5 px-6">Date Added</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading file vault...
                  </td>
                </tr>
              ) : files.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400">
                    <HardDrive className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">No files stored in Vault yet</p>
                    <p className="text-xs text-slate-400 mt-1">Upload your first large file above using chunked transfer.</p>
                  </td>
                </tr>
              ) : (
                files.map((file) => (
                  <tr key={file._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                          {getFileIcon(file.extension)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 break-all">{file.fileName}</p>
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-600 uppercase border border-slate-200">
                            {file.extension || 'FILE'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">
                      {formatBytes(file.fileSize)}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-indigo-600">{file.uploadedByName || 'SuperAdmin'}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {file.totalChunks || 1} chunks ({file.uploadFormat || 'binary'})
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-800">
                      {file.downloadCount || 0}
                    </td>
                    <td className="py-4 px-6 text-slate-500 font-medium">
                      {new Date(file.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Download Stream Button */}
                        <button
                          onClick={() => handleDownload(file)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                          title="Stream Download"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </button>

                        {/* Copy Link Button */}
                        <button
                          onClick={() => copyDownloadUrl(file)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                          title="Copy Direct Download Link"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(file)}
                          className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                          title="Delete File"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default FileVaultManager;
