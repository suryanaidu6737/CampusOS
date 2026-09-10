import React, { useState } from 'react';
import API from '../services/api';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  Download,
  Users,
  UserCheck,
  AlertCircle,
  RefreshCw,
  Layers
} from 'lucide-react';

// Lightweight browser CSV parser
const parseCSVText = (text) => {
  const lines = text.split(/\r\n|\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line) => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };

  const headers = parseLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const rawValues = parseLine(lines[i]);
    if (rawValues.every((v) => v === '')) continue;
    const rowObj = {};
    headers.forEach((h, index) => {
      rowObj[h] = rawValues[index] || '';
    });
    rows.push(rowObj);
  }

  return { headers, rows };
};

export const AdminImportUsersModal = ({ isOpen, onClose, onImportSuccess }) => {
  const [importType, setImportType] = useState('AUTO'); // 'AUTO' | 'STUDENT' | 'FACULTY'
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  
  const [validationResult, setValidationResult] = useState(null);
  const [finalReport, setFinalReport] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const downloadSampleCSV = () => {
    let csvContent = '';
    if (importType === 'AUTO') {
      csvContent = `entity_type,student_id,employee_id,name,email,department,year,section,role,institution
student,RIT24CSE001,,Aarav Sharma,RIT24CSE001@rit.edu.in,CSE,2,A,Student,Riverside Institute of Technology
student,RIT24ECE001,,Ananya Rao,RIT24ECE001@rit.edu.in,ECE,3,A,Student,Riverside Institute of Technology
faculty,,RITFAC001,Dr. Vikram Rao,vikram.rao@rit.edu.in,CSE,,,Professor,Riverside Institute of Technology
faculty,,RITFAC002,Dr. Priya Menon,priya.menon@rit.edu.in,ECE,,,Associate Professor,Riverside Institute of Technology`;
    } else if (importType === 'STUDENT') {
      csvContent = `student_id,name,email,department,year,section
RIT24CSE001,Aarav Sharma,RIT24CSE001@rit.edu.in,CSE,2,A
RIT24ECE001,Ananya Rao,RIT24ECE001@rit.edu.in,ECE,3,A`;
    } else {
      csvContent = `employee_id,name,email,department,designation
RITFAC001,Dr. Vikram Rao,vikram.rao@rit.edu.in,CSE,Professor
RITFAC002,Dr. Priya Menon,priya.menon@rit.edu.in,ECE,Associate Professor`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sample_${importType.toLowerCase()}_import.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setErrorMessage('Please select a valid .csv file format');
      return;
    }

    setFile(selectedFile);
    setErrorMessage('');
    setValidationResult(null);
    setFinalReport(null);

    setParsing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const { rows } = parseCSVText(text);

        if (rows.length === 0) {
          setErrorMessage('The uploaded CSV file is empty or contains no data rows');
          setParsing(false);
          return;
        }

        // Validate parsed rows against database via backend
        setValidating(true);
        const res = await API.post('/auth/users/import-validate', {
          importType,
          rows,
        });

        if (res.data.success) {
          setValidationResult(res.data);
        } else {
          setErrorMessage(res.data.message || 'Validation failed');
        }
      } catch (err) {
        console.error('CSV Parsing/Validation Error:', err);
        setErrorMessage(err.response?.data?.message || 'Failed to parse and validate CSV file');
      } finally {
        setParsing(false);
        setValidating(false);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleExecuteImport = async () => {
    if (!validationResult || validationResult.validCount === 0) return;

    const validRowsToImport = validationResult.validatedRows.filter((r) => r.isValid);

    try {
      setImporting(true);
      setErrorMessage('');
      const res = await API.post('/auth/users/import-execute', {
        importType,
        validRows: validRowsToImport,
      });

      if (res.data.success) {
        setFinalReport(res.data);
        if (onImportSuccess) onImportSuccess();
      } else {
        setErrorMessage(res.data.message || 'Import execution failed');
      }
    } catch (err) {
      console.error('Import execution error:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to execute user import');
    } finally {
      setImporting(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setValidationResult(null);
    setFinalReport(null);
    setErrorMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-50 rounded-2xl text-brand-600 border border-brand-100">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Import Users via CSV</h2>
              <p className="text-xs text-slate-500 font-medium">
                Batch register Students or Faculty into MongoDB Atlas with automated activation codes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Import Error</p>
                <p className="text-rose-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {!finalReport ? (
            <>
              {/* Step 1: Import Type Selection & Template */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <p className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-2">
                    1. Select Import Format Mode
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        setImportType('AUTO');
                        resetState();
                      }}
                      className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                        importType === 'AUTO'
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Auto / Combined Batch</span>
                    </button>

                    <button
                      onClick={() => {
                        setImportType('STUDENT');
                        resetState();
                      }}
                      className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                        importType === 'STUDENT'
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Student Only Batch</span>
                    </button>

                    <button
                      onClick={() => {
                        setImportType('FACULTY');
                        resetState();
                      }}
                      className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                        importType === 'FACULTY'
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Faculty Only Batch</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={downloadSampleCSV}
                  className="px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-brand-600" />
                  <span>Download Sample CSV</span>
                </button>
              </div>

              {/* Step 2: Upload CSV File */}
              {!validationResult && (
                <div className="border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-2xl p-8 text-center bg-slate-50/50 transition relative group">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="p-4 bg-brand-50 rounded-full text-brand-600 group-hover:scale-110 transition">
                      <Upload className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">
                        Click or Drag & Drop .CSV file to upload
                      </p>
                      <p className="text-slate-400 mt-1">
                        Supported columns: entity_type, student_id, employee_id, name, email, department, year, section, role
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {(parsing || validating) && (
                <div className="p-8 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-brand-600 animate-spin mx-auto" />
                  <p className="font-bold text-slate-700">
                    {parsing ? 'Parsing CSV structure...' : 'Validating rows against MongoDB Atlas database...'}
                  </p>
                </div>
              )}

              {/* Step 3: Validation Summary & Row Preview Table */}
              {validationResult && (
                <div className="space-y-4">
                  {/* Summary Bar */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200 text-center">
                      <p className="text-slate-400 font-bold text-[10px] uppercase">Total Rows</p>
                      <p className="text-lg font-black text-slate-900">{validationResult.totalRows}</p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                      <p className="text-emerald-600 font-bold text-[10px] uppercase">Valid & Ready</p>
                      <p className="text-lg font-black text-emerald-700">{validationResult.validCount}</p>
                    </div>
                    <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-center">
                      <p className="text-rose-600 font-bold text-[10px] uppercase">Errors / Skipped</p>
                      <p className="text-lg font-black text-rose-700">{validationResult.invalidCount}</p>
                    </div>
                  </div>

                  {/* Row Preview Table */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 sticky top-0 text-slate-500 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">Row</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Role</th>
                          <th className="py-2.5 px-3">Name</th>
                          <th className="py-2.5 px-3">Email</th>
                          <th className="py-2.5 px-3">ID</th>
                          <th className="py-2.5 px-3">Dept</th>
                          <th className="py-2.5 px-3">Validation Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {validationResult.validatedRows.map((r) => (
                          <tr
                            key={r.rowNumber}
                            className={r.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/40 hover:bg-rose-50/70'}
                          >
                            <td className="py-2 px-3 font-mono text-slate-500">#{r.rowNumber}</td>
                            <td className="py-2 px-3">
                              {r.isValid ? (
                                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                                  <CheckCircle2 className="w-3 h-3" /> Valid
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 text-[10px]">
                                  <AlertTriangle className="w-3 h-3" /> Invalid
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 font-bold">
                              <span className={`px-2 py-0.5 text-[9px] rounded-full font-extrabold border ${
                                r.data.role === 'FACULTY' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}>
                                {r.data.role}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-bold text-slate-900">{r.data.name || '—'}</td>
                            <td className="py-2 px-3 text-slate-600">{r.data.email || '—'}</td>
                            <td className="py-2 px-3 font-mono text-slate-700">
                              {r.data.studentId || r.data.employeeId || '—'}
                            </td>
                            <td className="py-2 px-3 text-slate-700">{r.data.departmentCode || r.data.departmentInput || '—'}</td>
                            <td className="py-2 px-3">
                              {r.isValid ? (
                                <span className="text-emerald-600 font-semibold">Ready for import</span>
                              ) : (
                                <span className="text-rose-600 font-bold">{r.errors.join('; ')}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Step 4: Final Import Report Screen */
            <div className="space-y-6 animate-fadeIn">
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-slate-900">User Import Completed!</h3>
                <p className="text-xs text-slate-600">
                  Users have been successfully created in MongoDB Atlas with status <span className="font-bold text-amber-700">Pending Activation</span>.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Imported</p>
                  <p className="text-2xl font-black text-emerald-600">{finalReport.imported}</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Skipped</p>
                  <p className="text-2xl font-black text-amber-600">{finalReport.skipped}</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Errors</p>
                  <p className="text-2xl font-black text-rose-600">{finalReport.errorCount}</p>
                </div>
              </div>

              {finalReport.errors && finalReport.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="font-bold text-slate-900">Error & Skip Details:</p>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-40 overflow-y-auto p-3 bg-rose-50/50 space-y-1">
                    {finalReport.errors.map((err, idx) => (
                      <p key={idx} className="text-[11px] text-rose-700">
                        <span className="font-bold">Row #{err.rowNumber}</span> ({err.email}): {err.reason}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          {validationResult && !finalReport ? (
            <button
              onClick={resetState}
              className="px-4 py-2 font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200 transition"
            >
              Re-upload Different CSV
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 font-bold text-slate-600 hover:text-slate-900 rounded-xl transition"
            >
              {finalReport ? 'Close' : 'Cancel'}
            </button>

            {validationResult && !finalReport && (
              <button
                onClick={handleExecuteImport}
                disabled={importing || validationResult.validCount === 0}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-brand-500/20 transition flex items-center gap-2"
              >
                {importing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Importing Users...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Import {validationResult.validCount} Valid Users</span>
                  </>
                )}
              </button>
            )}

            {finalReport && (
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg shadow-brand-500/20 transition"
              >
                Done
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
