import React, { useState } from "react";
import { Key } from "lucide-react";
import Modal from "./Modal";
import Input from "./Input";
import Button from "./Button";
import OTPModal from "./OTPModal";
import PasswordResetSuccessModal from "./PasswordResetSuccessModal";
import { sendForgotPasswordOTP, resetPassword } from "../services/authServices";
import { AxiosError } from "axios";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChangePassword: (email: string, password: string) => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    email: "",
    role: "user" as "user" | "mentor",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSendOTP = async () => {
    if (!formData.email) {
      setError("Please enter your email");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      let res = await sendForgotPasswordOTP({ email: formData.email }, formData.role);
      setShowOTPModal(true);
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      const msg =
        error.response?.data?.message || error.message || "Failed to send OTP";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerified = () => {
    setShowOTPModal(false);
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async () => {
    if (!newPassword || newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await resetPassword(
        { email: formData.email, newPassword },
        formData.role,
      );
      setShowPasswordModal(false);
      setShowSuccessModal(true);
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Failed to change password";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ email: "", role: "user" });
    setError("");
    setShowOTPModal(false);
    setShowPasswordModal(false);
    setShowSuccessModal(false);
    setNewPassword("");
    setConfirmPassword("");
    onClose();
  };

  if (showOTPModal) {
    return (
      <OTPModal
        isOpen={isOpen}
        onClose={handleClose}
        email={formData.email}
        role={formData.role}
        isForgotPassword={true}
        onVerified={handleOTPVerified}
      />
    );
  }

  if (showPasswordModal) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Set New Password"
        icon={<Key className="h-6 w-6 text-gray-800" />}
      >
        <div className="space-y-4">
          <p className="text-gray-700 text-center">
            OTP verified successfully. Enter your new password.
          </p>

          <Input
            type="password"
            placeholder="Enter New Password"
            value={newPassword}
            onChange={(val) => setNewPassword(val)}
          />

          <Input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(val) => setConfirmPassword(val)}
          />

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}

          <div className="pt-2">
            <Button
              variant="primary"
              onClick={handlePasswordSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Changing..." : "Change Password"}
            </Button>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={handleClose}
              className="text-gray-800 hover:text-gray-900 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  if (showSuccessModal) {
    return (
      <PasswordResetSuccessModal
        isOpen={isOpen}
        onClose={() => {
          setShowSuccessModal(false);
          handleClose();
        }}
      />
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Forgot Password"
      icon={<Key className="h-6 w-6 text-gray-800" />}
    >
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-gray-800 mb-4">
            Enter your registered email. We'll send an OTP to verify your
            identity.
          </p>
        </div>

        <div className="flex items-center justify-center space-x-4 p-3 bg-gray-50 rounded-lg">
          <label className="text-sm font-medium text-gray-700">
            Account Type:
          </label>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: "user" })}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                formData.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              User
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: "mentor" })}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                formData.role === "mentor"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Mentor
            </button>
          </div>
        </div>

        <Input
          type="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={(value) => setFormData({ ...formData, email: value })}
        />

        {error && <p className="text-red-600 text-sm text-center">{error}</p>}

        <div className="pt-2">
          <Button
            variant="primary"
            onClick={handleSendOTP}
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send OTP"}
          </Button>
        </div>

        <div className="text-center pt-2">
          <button
            onClick={handleClose}
            className="text-gray-800 hover:text-gray-900 font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ChangePasswordModal;
