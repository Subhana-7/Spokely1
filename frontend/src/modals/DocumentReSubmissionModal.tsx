import React, { useState } from "react";
import { FileText, Upload } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";
import DocumentResubmissionSuccessModal from "./DocumentResubmissionSuccessModal";
import { resubmitDocument } from "../services/authServices";
import { uploadImageToCloudinary } from "../utilis/cloudinary ";
import { AxiosError } from "axios";

interface DocumentResubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

const DocumentResubmissionModal: React.FC<DocumentResubmissionModalProps> = ({
  isOpen,
  onClose,
  email,
}) => {
  const [documentUrl, setDocumentUrl] = useState("");
  const [textMessage, setTextMessage] = useState("");
  const [documentLoading, setDocumentLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  const handleDocumentResubmit = async () => {
    if (!documentUrl) {
      setErrors({ email: "Please upload a document" });
      return;
    }

    if (!textMessage.trim()) {
      setErrors({
        password: "Please provide a message explaining the resubmission",
      });
      return;
    }

    setDocumentLoading(true);
    setErrors({});

    try {
      await resubmitDocument(email, documentUrl, textMessage);

      setShowSuccessModal(true);
    } catch (err: unknown) {
       const error = err as AxiosError<{ message?: string }>;
      console.error("Resubmit error:", err);

      let errorMessage = "Failed to resubmit document";

      if (error.response) {
        errorMessage =
          error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = "No response from server. Please check your connection.";
      } else {
        errorMessage = error.message || "An unexpected error occurred";
      }

      setErrors({ email: errorMessage });
    } finally {
      setDocumentLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploadLoading(true);
    setErrors({});

    try {
      const url = await uploadImageToCloudinary(file);
      setDocumentUrl(url);
    } catch (error) {
      console.error("File upload failed", error);
      setErrors({ email: "Failed to upload document. Please try again." });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleClose = () => {
    setDocumentUrl("");
    setTextMessage("");
    setShowSuccessModal(false);
    setUploadLoading(false);
    setErrors({});
    onClose();
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setDocumentUrl("");
    setTextMessage("");
    setErrors({});
    onClose();
  };

  if (showSuccessModal) {
    return (
      <DocumentResubmissionSuccessModal
        isOpen={isOpen}
        onClose={handleSuccessModalClose}
      />
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Document Resubmission Required"
      icon={<FileText className="h-6 w-6 text-orange-600" />}
    >
      <div className="space-y-4">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-orange-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800">
                Document Verification Rejected
              </h3>
              <div className="mt-2 text-sm text-orange-700">
                <p>
                  Your submitted document was rejected. Please upload a new
                  document for verification.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <textarea
            value={textMessage}
            onChange={(e) => {
              setTextMessage(e.target.value);
              if (errors.password)
                setErrors((prev) => ({ ...prev, password: "" }));
            }}
            placeholder="Please explain why you're resubmitting this document..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload New Document
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
            {uploadLoading ? (
              <div className="space-y-1 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Uploading document...</p>
                </div>
              </div>
            ) : documentUrl ? (
              <div className="space-y-1 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12">
                  <svg
                    className="h-8 w-8 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="text-sm text-green-600">
                  <p>Document uploaded successfully!</p>
                  <button
                    type="button"
                    onClick={() => setDocumentUrl("")}
                    className="mt-1 text-blue-600 hover:text-blue-500 underline"
                  >
                    Upload different file
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="document-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="document-upload"
                      name="document-upload"
                      type="file"
                      className="sr-only"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PDF, DOC, DOCX, JPG, PNG up to 10MB
                </p>
              </div>
            )}
          </div>
          {errors.email && (
            <p className="mt-2 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        <Button
          variant="primary"
          onClick={handleDocumentResubmit}
          disabled={
            documentLoading ||
            !documentUrl ||
            !textMessage.trim() ||
            uploadLoading
          }
          className="w-full"
        >
          {documentLoading ? "Submitting..." : "Resubmit Document"}
        </Button>
      </div>
    </Modal>
  );
};

export default DocumentResubmissionModal;
