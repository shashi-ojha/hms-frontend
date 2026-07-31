"use client";

import { useEffect, useState } from "react";
import { FileText, FileImage, Upload, Download, Trash2, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  getPatientFiles,
  uploadPatientFile,
  deletePatientFile,
  downloadPatientFileBlob,
  apiErrorMessage,
} from "@/lib/api";
import { PatientFileResponse } from "@/lib/types";
import { formatDate } from "@/lib/format";

const fileTypes = ["REPORT", "XRAY", "PRESCRIPTION"];

export function PatientFilesSection({
  patientId,
  canUpload = true,
  canDelete = false,
}: {
  patientId: number;
  canUpload?: boolean;
  canDelete?: boolean;
}) {
  const [files, setFiles] = useState<PatientFileResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState("REPORT");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<PatientFileResponse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await getPatientFiles(patientId);
      setFiles(data);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (patientId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;
    setError("");
    setUploading(true);
    try {
      await uploadPatientFile({
        patientId,
        file: selectedFile,
        fileType,
        description,
      });
      setSelectedFile(null);
      setDescription("");
      setShowUpload(false);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't upload the file. PDF or images only, 10MB max."));
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(f: PatientFileResponse) {
    setDownloadingId(f.id);
    try {
      await downloadPatientFileBlob(f.downloadUrl, f.originalFileName);
    } catch {
      setError("Couldn't download this file.");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePatientFile(deleteTarget.id);
      await load();
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-ink-900">
          Files &amp; reports
        </h3>
        {canUpload && (
          <Button size="sm" variant="secondary" onClick={() => setShowUpload((s) => !s)}>
            <Plus className="h-3.5 w-3.5" />
            Upload
          </Button>
        )}
      </div>

      {showUpload && (
        <form onSubmit={handleUpload} className="mb-4 space-y-3 rounded-xl bg-brand-50/60 p-3.5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select value={fileType} onChange={(e) => setFileType(e.target.value)}>
              {fileTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="text-sm text-ink-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-700 file:px-3 file:py-2 file:text-xs file:font-medium file:text-white"
              required
            />
          </div>
          <Input
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {error && <Alert tone="error">{error}</Alert>}
          <Button type="submit" size="sm" loading={uploading}>
            <Upload className="h-3.5 w-3.5" />
            Upload file
          </Button>
        </form>
      )}

      {loading ? (
        <Skeleton className="h-20 w-full" />
      ) : files.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No files yet"
          description="Reports, X-rays and prescriptions will appear here."
        />
      ) : (
        <div className="space-y-2">
          {files.map((f) => {
            const Icon = f.contentType?.startsWith("image/") ? FileImage : FileText;
            return (
              <div
                key={f.id}
                className="flex items-center gap-3 rounded-xl border border-ink-100 px-3.5 py-2.5"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-900">
                    {f.originalFileName}
                  </p>
                  <p className="text-xs text-ink-500">
                    {f.fileType} · {formatDate(f.createdAt)}
                    {f.description && ` · ${f.description}`}
                  </p>
                </div>
                <button
                  onClick={() => handleDownload(f)}
                  disabled={downloadingId === f.id}
                  className="flex-shrink-0 rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 hover:text-brand-700 disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                </button>
                {canDelete && (
                  <button
                    onClick={() => setDeleteTarget(f)}
                    className="flex-shrink-0 rounded-lg p-1.5 text-ink-500 hover:bg-coral-50 hover:text-coral-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete this file?"
        description={`"${deleteTarget?.originalFileName}" will be permanently removed.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </Card>
  );
}