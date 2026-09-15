import { useEffect, useState } from "react";
import {
  Download,
  Eye,
  FileText,
  FolderOpen,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePermissions } from "../context/PermissionContext";
import {
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
} from "../api/employeeApi";

const API_BASE = "http://127.0.0.1:5000";

const documentTypes = [
  "Resume",
  "Aadhaar Card",
  "PAN Card",
  "Passport",
  "Driving License",
  "Offer Letter",
  "Experience Certificate",
  "Education Certificate",
  "Other",
];

function getDocumentUrl(fileUrl) {
  if (!fileUrl) return "";
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    return fileUrl;
  }
  return `${API_BASE}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
}

function FormInput({ label, name, value, onChange, type = "text", placeholder, required = false }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-300">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500"
      />
    </div>
  );
}

function Documents() {
  const { user } = useAuth();
  const { role } = usePermissions();

  const employeeId = user?.employeeId || user?.employee || "";
  const isEmployee = role === "Employee";

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [form, setForm] = useState({
    documentName: "",
    documentType: "Other",
    documentNumber: "",
    issueDate: "",
    expiryDate: "",
    documentFile: null,
  });

  // Employee Documents page is only for the logged-in employee.
  // HR/Admin use Employees -> specific employee -> Documents tab.
  useEffect(() => {
    if (!isEmployee || !employeeId) return;

    const loadDocuments = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getDocuments(employeeId);
        setDocuments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("LOAD DOCUMENTS ERROR:", err);
        setError(
          err.response?.data?.message || "Failed to load your documents"
        );
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, [isEmployee, employeeId]);

  const resetForm = () => {
    setForm({
      documentName: "",
      documentType: "Other",
      documentNumber: "",
      issueDate: "",
      expiryDate: "",
      documentFile: null,
    });
  };

  const openAdd = () => {
    setEditingDocument(null);
    resetForm();
    setShowModal(true);
  };

  const openEdit = (document) => {
    setEditingDocument(document);
    setForm({
      documentName: document.documentName || "",
      documentType: document.documentType || "Other",
      documentNumber: document.documentNumber || "",
      issueDate: document.issueDate || "",
      expiryDate: document.expiryDate || "",
      documentFile: null,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingDocument(null);
    resetForm();
  };

  const handleInput = (event) => {
    const { name, value, files } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: name === "documentFile" ? files?.[0] || null : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!employeeId) {
      alert("Your account is not linked to an employee profile. Please contact HR/Admin.");
      return;
    }

    if (!form.documentName.trim()) {
      alert("Document name is required.");
      return;
    }

    if (!editingDocument && !form.documentFile) {
      alert("Please select a document file.");
      return;
    }

    if (
      form.issueDate &&
      form.expiryDate &&
      new Date(form.expiryDate) < new Date(form.issueDate)
    ) {
      alert("Expiry date cannot be before issue date.");
      return;
    }

    if (form.documentFile && form.documentFile.size > 10 * 1024 * 1024) {
      alert("File size must be 10 MB or less.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const data = new FormData();
      data.append("documentName", form.documentName.trim());
      data.append("documentType", form.documentType);
      data.append("documentNumber", form.documentNumber || "");
      data.append("issueDate", form.issueDate || "");
      data.append("expiryDate", form.expiryDate || "");

      // This name MUST match upload.single("documentFile") in employeeRoutes.js
      data.append("documentFile", form.documentFile);

      if (editingDocument) {
        const updated = await updateDocument(
          employeeId,
          editingDocument._id,
          data
        );

        setDocuments((previous) =>
          previous.map((item) =>
            item._id === editingDocument._id ? updated : item
          )
        );
      } else {
        const created = await createDocument(employeeId, data);
        setDocuments((previous) => [created, ...previous]);
      }

      // IMPORTANT: close only AFTER the request succeeds.
      setShowModal(false);
      setEditingDocument(null);
      resetForm();
    } catch (err) {
      console.error("DOCUMENT SAVE ERROR:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to upload document"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      setLoading(true);
      await deleteDocument(employeeId, documentId);
      setDocuments((previous) =>
        previous.filter((item) => item._id !== documentId)
      );
    } catch (err) {
      console.error("DELETE DOCUMENT ERROR:", err);
      alert(err.response?.data?.message || "Failed to delete document");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  // HR/Admin should access documents from a specific Employee Profile,
  // not from the Documents sidebar page.
  if (!isEmployee) {
    return <Navigate to="/employees" replace />;
  }

  return (
    <div className="min-h-full p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-blue-500">
              <FolderOpen size={21} />
              <span className="text-sm font-semibold">My Documents</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Documents</h1>
            <p className="mt-1 text-sm text-slate-400">
              Upload, view, download, edit and delete your own employee documents.
            </p>
          </div>

          <button
            onClick={openAdd}
            disabled={!employeeId || saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload size={18} />
            Upload Document
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {user.name || "My"} Documents
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {documents.length} document{documents.length === 1 ? "" : "s"} stored in your employee profile.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
          {loading && documents.length === 0 ? (
            <div className="flex items-center justify-center p-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
            </div>
          ) : documents.length === 0 ? (
            <div className="p-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-950/50 text-blue-400">
                <FileText size={30} />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">
                No documents uploaded
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
                Upload your resume, Aadhaar Card, PAN Card, certificates, offer letter or other important documents.
              </p>
              <button
                onClick={openAdd}
                disabled={!employeeId}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
              >
                <Plus size={17} />
                Upload First Document
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Document</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Document Number</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Issue Date</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Expiry Date</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((document) => (
                    <tr key={document._id} className="border-b border-slate-800/70 last:border-0">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-950/60 text-blue-400">
                            <FileText size={19} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-white">{document.documentName}</p>
                            <p className="max-w-[260px] truncate text-xs text-slate-500">
                              {document.fileName || "No file"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">{document.documentType || "Other"}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{document.documentNumber || "—"}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{document.issueDate || "—"}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{document.expiryDate || "—"}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1">
                          {document.fileUrl && (
                            <>
                              <a
                                href={getDocumentUrl(document.fileUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-blue-400"
                                title="View document"
                              >
                                <Eye size={17} />
                              </a>
                              <a
                                href={getDocumentUrl(document.fileUrl)}
                                download={document.fileName}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-green-400"
                                title="Download document"
                              >
                                <Download size={17} />
                              </a>
                            </>
                          )}

                          <button
                            onClick={() => openEdit(document)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-blue-400"
                            title="Edit document"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            onClick={() => handleDelete(document._id)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-red-400"
                            title="Delete document"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {editingDocument ? "Edit Document" : "Upload Document"}
                </h2>
                <p className="mt-1 text-sm text-slate-400">{user.name || "My Documents"}</p>
              </div>
              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <FormInput
                label="Document Name"
                name="documentName"
                value={form.documentName}
                onChange={handleInput}
                placeholder="e.g. Aadhaar Card"
                required
              />

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Document Type
                </label>
                <select
                  name="documentType"
                  value={form.documentType}
                  onChange={handleInput}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500"
                >
                  {documentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <FormInput
                label="Document Number"
                name="documentNumber"
                value={form.documentNumber}
                onChange={handleInput}
                placeholder="Optional"
              />

              <div className="grid gap-5 md:grid-cols-2">
                <FormInput
                  label="Issue Date"
                  name="issueDate"
                  type="date"
                  value={form.issueDate}
                  onChange={handleInput}
                />
                <FormInput
                  label="Expiry Date"
                  name="expiryDate"
                  type="date"
                  value={form.expiryDate}
                  onChange={handleInput}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  {editingDocument ? "Replace File (Optional)" : "Document File"}
                  {!editingDocument && <span className="ml-1 text-red-500">*</span>}
                </label>
                <input
                  type="file"
                  name="documentFile"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleInput}
                  required={!editingDocument}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm text-slate-300 file:mr-4 file:rounded-md file:border-0 file:bg-blue-950 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-300"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Allowed: PDF, JPG, PNG, DOC and DOCX. Maximum size: 10 MB.
                </p>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-slate-600 px-5 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Save size={17} />
                  )}
                  {editingDocument ? "Update Document" : "Upload Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Documents;
