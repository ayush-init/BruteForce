"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, Info, Download, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Select } from "@/components/Select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getAllCities } from '@/services/city.service';
import { getAllBatches } from '@/services/batch.service';
import { City } from '@/types/superadmin/city.types';
import { Batch } from '@/types/superadmin/batch.types';
import { bulkUploadStudents } from '@/services/admin.service';
import { showSuccess } from '@/ui/toast';
import { BulkUploadModalProps, BulkUploadResult, CsvRowData } from '@/types/admin/student.types';

export default function BulkUploadModal({
  open,
  onOpenChange,
  onSuccess,
}: BulkUploadModalProps) {

  const [file, setFile] = useState<File | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [defaultPassword, setDefaultPassword] = useState<string>('password123');
  const [loading, setLoading] = useState(false);
  const [csvData, setCsvData] = useState<CsvRowData[]>([]);
  const [showGuide, setShowGuide] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; totalRows: number; message: string } | null>(null);
  const [csvValidated, setCsvValidated] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Data states
  const [cities, setCities] = useState<City[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  // Fetch cities and batches on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [citiesData, batchesData] = await Promise.all([
          getAllCities(),
          getAllBatches()
        ]);
        setCities(citiesData);
        setBatches(batchesData);
      } catch (error) {
        // Error is handled by API client interceptor
        console.error('Failed to fetch data:', error);
      }
    };
    if (open) fetchData();
  }, [open]);

  // Reset selections when city changes
  const handleCityChange = useCallback((value: string | number) => {
    const cityId = value.toString();
    setSelectedCity(cityId);
    setSelectedYear('');
    setSelectedBatch('');
  }, []);

  // Reset batch when year changes
  const handleYearChange = useCallback((value: string | number) => {
    const year = value.toString();
    setSelectedYear(year);
    setSelectedBatch('');
  }, []);

  // Get unique years for selected city
  const getYearsForCity = useCallback(() => {
    if (!selectedCity) return [];
    const cityBatches = batches.filter((b: Batch) => b.city_id === Number(selectedCity));
    const years = [...new Set(cityBatches.map((b: Batch) => b.year))];
    return years.sort((a, b) => b - a); // Sort descending (newest first)
  }, [selectedCity, batches]);

  // Get batches for selected city and year
  const getBatchesForCityYear = useCallback(() => {
    if (!selectedCity || !selectedYear) return [];
    return batches.filter((b: Batch) =>
      b.city_id === Number(selectedCity) && b.year === Number(selectedYear)
    );
  }, [selectedCity, selectedYear, batches]);

  const handleClose = () => {
    if (!loading) {
      setShowResult(false);
      setUploadResult(null);
      setValidationResult(null);
      setCsvValidated(false);
      setValidationError('');
      onOpenChange(false);
      // Reset form
      setFile(null);
      setSelectedCity('');
      setSelectedYear('');
      setSelectedBatch('');
      setDefaultPassword('password123');
      setCsvData([]);
    }
  };

  // CSV Validation
  const validateCSV = useCallback((data: CsvRowData[]) => {

    if (!data || data.length === 0) {
      return 'CSV file is empty or invalid';
    }

    const requiredColumns = ['name', 'email', 'enrollment_id'];
    const firstRow = data[0];

    // Check required columns
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));
    if (missingColumns.length > 0) {
      return `Missing required columns: ${missingColumns.join(', ')}`;
    }

    // Validate each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      if (!row.name || !row.email || !row.enrollment_id) {
        return `Row ${i + 1}: Missing required data (name, email, enrollment_id)`;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email)) {
        return `Row ${i + 1}: Invalid email format - ${row.email}`;
      }

      // Domain validation - must contain pwioi.com
      if (!row.email.includes('pwioi.com')) {
        return `Row ${i + 1}: Email must contain pwioi.com domain - ${row.email}`;
      }
    }

    return null; // Valid
  }, []);

  // Parse CSV file
  const parseCSV = useCallback((file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;

        const lines = text.trim().split('\n');

        if (lines.length < 2) {
          setValidationError('CSV must contain at least a header and one data row');
          setValidationResult({
            isValid: false,
            totalRows: 0,
            message: 'CSV Validation Failed'
          });
          setCsvValidated(true);
          setCsvData([]);
          return;
        }

        // Parse CSV (simple comma-separated parser)
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const row: CsvRowData = {} as CsvRowData;

          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });

          data.push(row);
        }

        // Validate parsed data
        const error = validateCSV(data);
        if (error) {
          setValidationError(error);
          setCsvData([]);
          setValidationResult({
            isValid: false,
            totalRows: data.length,
            message: 'CSV Validation Failed'
          });
          setCsvValidated(true);
        } else {
          setCsvData(data);
          setValidationResult({
            isValid: true,
            totalRows: data.length,
            message: `CSV Valid - ${data.length} students ready to upload`
          });
          setCsvValidated(true);
        }
      } catch (error) {
        console.error('CSV parsing error:', error);
        setValidationError('Failed to parse CSV file');
        setValidationResult({
          isValid: false,
          totalRows: 0,
          message: 'CSV Validation Failed'
        });
        setCsvValidated(true);
        setCsvData([]);
      }
    };

    reader.onerror = () => {
      setValidationError('Failed to read file');
      setValidationResult({
        isValid: false,
        totalRows: 0,
        message: 'CSV Validation Failed'
      });
      setCsvValidated(true);
      setCsvData([]);
    };

    reader.readAsText(file);
  }, [validateCSV]);

  // Handle file selection
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setValidationError('Please select a CSV file');
        setValidationResult({
          isValid: false,
          totalRows: 0,
          message: 'CSV Validation Failed'
        });
        setCsvValidated(true);
        setCsvData([]);
        return;
      }

      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  }, [parseCSV]);

  // Handle upload
  const handleUpload = useCallback(async () => {
    if (!file || !selectedBatch) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('batch_id', selectedBatch);

      const result = await bulkUploadStudents(formData);

      setUploadResult(result);
      setShowResult(true);

      // Call onSuccess callback
      if (onSuccess) {
        onSuccess(result);
      }

      showSuccess('Upload Complete', `Successfully added ${result.inserted} student accounts.`);
    } catch (error) {
      // Error is handled by API client interceptor
      console.error('Upload failed:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Upload failed. Please try again.';
      setValidationError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [file, selectedBatch, onSuccess]);

  // Download sample CSV. Uses real-looking PW IOI examples so admins can
  // see the expected name / email / enrollment-id format at a glance
  // (10-digit enrollment IDs matching the institute pattern, @pwioi.com
  // emails with the `<firstname>.sot<rollSuffix>` convention).
  const downloadSampleCSV = useCallback(() => {
    const sampleData = [
      ['name', 'email', 'enrollment_id'],
      ['Dhruv', 'dhruv.sot2428@pwioi.com', '2401012428'],
      ['Ayush', 'ayush.sot2324@pwioi.com', '2401012324']
    ];

    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_students.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, []);

  // Check if upload should be disabled
  const isUploadDisabled = !selectedCity || !selectedYear || !selectedBatch || !file || !csvValidated || !validationResult?.isValid || loading;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="w-full max-w-[calc(100%-1rem)] sm:max-w-[520px] max-h-[90vh] p-0 flex flex-col overflow-hidden rounded-2xl">

          {/* HEADER */}
          <DialogHeader className="px-4 sm:px-6 py-4 sm:py-5 border-b border-border/40">
            <DialogTitle className="text-3xl sm:text-3xl font-semibold flex items-center sm:gap-1">

              Bulk <span className='text-primary' >Upload</span>
            </DialogTitle>

            <DialogDescription className="text-xs text-muted-foreground">
              Upload multiple students via CSV file
            </DialogDescription>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
              <KeyRound className="w-3 h-3 text-logo shrink-0" />
              Default password for all students:
              <span className="font-mono font-semibold text-logo">bruteforce@123</span>
            </div>
          </DialogHeader>

          {/* BODY */}
          <div className="p-6 space-y-6 overflow-y-auto no-scrollbar">

            {/* LOCATION */}
            <div className="space-y-4 sm:space-y-5 p-4 sm:p-5 rounded-2xl border border-border bg-muted/20">

              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground">
                Target Location
              </p>

              {/* CITY */}
              <div className="space-y-2">
                <Label className="text-[10px] sm:text-xs text-muted-foreground">
                  City <span className="text-destructive">*</span>
                </Label>

                <Select
                  value={selectedCity}
                  onChange={handleCityChange}
                  options={[
                    { label: 'Select city...', value: '' },
                    ...cities.map((city: City) => ({
                      label: city.city_name,
                      value: city.id.toString()
                    }))
                  ]}
                  className="h-10 sm:h-11"
                />
              </div>

              {/* YEAR */}
              <div className="space-y-2">
                <Label className="text-[10px] sm:text-xs text-muted-foreground">
                  Year <span className="text-destructive">*</span>
                </Label>

                <Select
                  value={selectedYear}
                  onChange={handleYearChange}
                  options={[
                    { label: 'Select year...', value: '' },
                    ...getYearsForCity().map((year: number) => ({
                      label: year.toString(),
                      value: year.toString()
                    }))
                  ]}
                  className="h-10 sm:h-11"
                  disabled={!selectedCity}
                />
              </div>

              {/* BATCH */}
              <div className="space-y-2">
                <Label className="text-[10px] sm:text-xs text-muted-foreground">
                  Batch <span className="text-destructive">*</span>
                </Label>

                <Select
                  value={selectedBatch}
                  onChange={(value: string | number) =>
                    setSelectedBatch(value.toString())
                  }
                  options={[
                    { label: 'Select batch...', value: '' },
                    ...getBatchesForCityYear().map((batch: Batch) => ({
                      label: batch.batch_name,
                      value: batch.id.toString()
                    }))
                  ]}
                  className="h-10 sm:h-11"
                  disabled={!selectedYear}
                />
              </div>

            </div>

            {/* FILE UPLOAD */}
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-[10px] sm:text-xs text-muted-foreground">
                CSV File <span className="text-destructive">*</span>
              </Label>

              <div className="border-2 border-dashed border-border rounded-2xl p-4 sm:p-6 text-center hover:border-logo/40 transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={loading}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-logo/10 flex items-center justify-center">
                    <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-logo" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-medium">
                      {file ? file.name : 'Click to upload CSV'}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {file ? 'File selected' : 'or drag and drop'}
                    </p>
                  </div>
                </label>
              </div>

              {file && (
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Selected:</span>
                  <span className="font-medium truncate max-w-[150px] sm:max-w-[200px]">{file.name}</span>
                  <button
                    onClick={() => {
                      setFile(null);
                      setCsvValidated(false);
                      setValidationResult(null);
                      setValidationError('');
                    }}
                    className="text-red-500 hover:text-red-600 text-xs sm:text-sm"
                    disabled={loading}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* VALIDATION RESULT */}
            {csvValidated && validationResult && (
              <div className={`rounded-2xl p-3 sm:p-4 ${validationResult.isValid
                ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}>
                <div className="flex items-start gap-2 sm:gap-3">
                  {validationResult.isValid ? (
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="space-y-1.5 sm:space-y-2">
                    <p className="text-xs sm:text-sm font-medium">
                      {validationResult.isValid
                        ? validationResult.message
                        : 'CSV Validation Failed'
                      }
                    </p>

                    {!validationResult.isValid && validationError && (
                      <div className="space-y-1">
                        <p className="text-[10px] sm:text-sm font-medium">Errors found:</p>
                        <ul className="text-[10px] sm:text-sm space-y-1 list-disc list-inside">
                          <li>{validationError}</li>
                        </ul>
                      </div>
                    )}

                    {validationResult.isValid && validationResult.totalRows > 0 && (
                      <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-current/20">
                        <p className="text-[10px] sm:text-sm">
                          Ready to create {validationResult.totalRows} students
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* GUIDE */}
            <div className="rounded-2xl px-3 sm:px-4 py-2 sm:py-3 bg-muted/20 border border-border">
              <div className="text-center mb-2 sm:mb-3">
                <p className="text-[10px] sm:text-sm text-muted-foreground">
                  Need CSV format help?
                </p>
              </div>

              <div className="flex flex-col gap-2 items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadSampleCSV}
                  className="rounded w-full max-w-xs"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Sample CSV
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGuide(true)}
                  className="rounded w-full max-w-xs"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Format Guide
                </Button>
              </div>
            </div>


          </div>

          {/* FOOTER */}
          <DialogFooter className=" border-t border-border/40 flex gap-2 sm:gap-3">

            <Button

              onClick={handleClose}
              disabled={loading}
              className="h-10 sm:h-11 bg-secondary-foreground! text-secondary! "
            >
              Cancel
            </Button>

            <Button
              disabled={isUploadDisabled}
              onClick={handleUpload}
              className="h-10 sm:h-11  font-semibold bg-primary text-black hover:opacity-90 transition-all"
            >
              {loading ? "Uploading..." : "Upload Students"}
            </Button>

          </DialogFooter>

        </DialogContent>
      </Dialog>

      {/* GUIDE MODAL */}
      <Dialog open={showGuide} onOpenChange={setShowGuide}>
        <DialogContent className="w-full max-w-[calc(100%-1rem)] sm:max-w-[920px] max-h-[90vh] p-0 rounded-2xl">

          {/* HEADER */}
          <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 bg-muted/40">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              CSV Format Guide
            </DialogTitle>
          </DialogHeader>

          {/* BODY */}
          <div className="p-6 space-y-6 overflow-y-auto no-scrollbar">

            {/* REQUIRED COLUMNS */}
            <div className="space-y-1.5 sm:space-y-2">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Required Columns
              </p>

              <div className="bg-background rounded-lg p-3 sm:p-4 text-xs sm:text-sm font-mono overflow-x-auto">
                name, email, enrollment_id
              </div>
            </div>

            {/* RULES */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">

              <div className="rounded-xl p-3 sm:p-4 bg-muted/30 space-y-1">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Name</p>
                <p className="text-xs sm:text-sm font-semibold">Student's full name</p>
              </div>

              <div className="rounded-xl p-3 sm:p-4 bg-muted/30 space-y-1">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Email</p>
                <p className="text-xs sm:text-sm font-semibold">Must contain @pwioi.com</p>
              </div>

              <div className="rounded-xl p-3 sm:p-4 bg-muted/30 space-y-1">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Enrollment ID</p>
                <p className="text-xs sm:text-sm font-semibold">Unique identifier</p>
              </div>

            </div>

            {/* EXAMPLE */}
            <div className="space-y-1.5 sm:space-y-2">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Example Row
              </p>

              <div className="bg-background rounded-lg p-3 sm:p-4 text-xs sm:text-sm font-mono overflow-x-auto">
                "Dhruv", "dhruv.sot2428@pwioi.com", "2401010031"
              </div>
            </div>

            {/* WARNING */}
            <div className="flex items-start gap-2 sm:gap-3 rounded-lg border-yellow-500/30 bg-yellow-500/10 p-3 sm:p-4 text-[10px] sm:text-sm text-yellow-400">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                Do <span className="font-semibold">NOT</span> include city, year, or batch in CSV.
                Always select batch using dropdown.
                Make sure all email addresses contain the <span className="font-semibold">pwioi.com</span> domain.
              </p>
            </div>

          </div>

          {/* FOOTER */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t flex flex-col sm:flex-row justify-between gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={downloadSampleCSV}
              className="rounded w-full sm:w-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Sample CSV
            </Button>

            <Button variant="ghost" onClick={() => setShowGuide(false)} className="w-full sm:w-auto">
              Close
            </Button>
          </div>

        </DialogContent>
      </Dialog>

      {/* UPLOAD RESULT MODAL */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="w-full max-w-[calc(100%-1rem)] sm:max-w-[500px] max-h-[90vh] p-0 overflow-hidden rounded-2xl">

          {/* HEADER */}
          <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 bg-muted/40">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              Upload Complete
            </DialogTitle>
          </DialogHeader>

          {/* BODY */}
          <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto no-scrollbar">

            {/* SUMMARY */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-3 sm:p-4">
              <p className="text-green-400 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                {uploadResult?.message || 'Students uploaded successfully'}
              </p>
            </div>

            {/* DETAILED STATS */}
            <div className="space-y-2 sm:space-y-3">
              <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-border/50">
                <span className="text-[10px] sm:text-sm text-muted-foreground">Total Rows in CSV</span>
                <span className="text-xs sm:text-sm font-semibold">{uploadResult?.totalRows || 0}</span>
              </div>

              <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-border/50">
                <span className="text-[10px] sm:text-sm text-muted-foreground">Successfully Uploaded</span>
                <span className="text-xs sm:text-sm font-semibold text-green-500">{uploadResult?.inserted || 0}</span>
              </div>

              {(uploadResult?.duplicates && uploadResult.duplicates > 0) && (
                <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-border/50">
                  <span className="text-[10px] sm:text-sm text-muted-foreground">Duplicate Students (Skipped)</span>
                  <span className="text-xs sm:text-sm font-semibold text-yellow-500">{uploadResult.duplicates}</span>
                </div>
              )}

              {(uploadResult?.invalidRows && uploadResult.invalidRows > 0) && (
                <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-border/50">
                  <span className="text-[10px] sm:text-sm text-muted-foreground">Invalid Rows (Skipped)</span>
                  <span className="text-xs sm:text-sm font-semibold text-red-500">{uploadResult.invalidRows}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-1.5 sm:py-2">
                <span className="text-[10px] sm:text-sm text-muted-foreground">Total Skipped</span>
                <span className="text-xs sm:text-sm font-semibold text-orange-500">{uploadResult?.skipped || 0}</span>
              </div>
            </div>

            {/* INFO */}
            <div className="text-[10px] sm:text-xs text-muted-foreground bg-muted/30 rounded-lg p-2 sm:p-3">
              <p>Duplicate students were not uploaded because they already exist in system.</p>
              <p>Invalid rows had incorrect format or missing required fields.</p>
            </div>
          </div>

          {/* FOOTER */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t">
            <Button
              onClick={() => {
                setShowResult(false);
                setUploadResult(null);
                handleClose();
              }}
              className="w-full h-10 sm:h-11"
            >
              Done
            </Button>
          </div>

        </DialogContent>
      </Dialog>
    </>
  );
}
