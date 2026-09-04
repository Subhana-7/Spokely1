import React, { useState } from "react";
import { UserPlus, Eye, EyeOff } from "lucide-react";
import Modal from "./Modal";
import Input from "./Input";
import Button from "./Button";
import Toggle from "./Toggle";
import { signup, sendOTP } from "../services/authServices";
import OTPModal from "./OTPModal";
import { uploadImageToCloudinary } from "../utilis/cloudinary ";
import { useNavigate } from "react-router-dom";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const SignupModal: React.FC<SignupModalProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "",
  });

  const [mentorData, setMentorData] = useState({
    documentUrl: "",
    textMessage: "",
  });

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    mentorDocument?: string;
    mentorMessage?: string;
  }>({});

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const roleOptions = [
    { value: "user", label: "User" },
    { value: "mentor", label: "Mentor" },
  ];

  const resetFormData = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "",
    });
    setMentorData({
      documentUrl: "",
      textMessage: "",
    });
    setErrors({});
    setShowPassword(false);
  };

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)
    ) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(
        formData.password,
      )
    ) {
      newErrors.password =
        "Password must be at least 8 characters long and include one uppercase letter, one lowercase letter, one number, and one special character.";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = "Enter a valid 10-digit phone number";
    }

    if (formData.role === "mentor") {
      if (!mentorData.documentUrl) {
        newErrors.mentorDocument = "Verification document is required";
      }

      const trimmedMessage = mentorData.textMessage.trim();
      if (!trimmedMessage) {
        newErrors.mentorMessage = "Please write a message to the Spokely team";
      } else if (trimmedMessage.length < 10) {
        newErrors.mentorMessage = "Message must be at least 10 characters long";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGoogleSignup = () => {
    const baseUrl = import.meta.env.VITE_SERVER_SIDE_URL;
    if (!baseUrl) {
      console.error("Missing VITE_SERVER_SIDE_URL in environment variables");
      return;
    }
    window.location.href = `${baseUrl}/api/users/google`;
    navigate("/user/home");
  };
  const handleFileUpload = async (file: File) => {
    try {
      const url = await uploadImageToCloudinary(file);
      setMentorData((prev) => ({
        ...prev,
        documentUrl: url,
      }));

      setErrors((prev) => ({ ...prev, mentorDocument: "" }));
    } catch (error) {
      console.error("File upload failed", error);
      alert("Failed to upload document. Please try again.");
    }
  };

  const handleCreateAccount = async () => {
    if (!validate()) return;

    try {
      await signup({
        ...formData,
        ...mentorData,
        role: formData.role as "user" | "mentor",
      });
      await sendOTP(
        { email: formData.email },
        formData.role as "user" | "mentor",
      );
      setShowOtpModal(true);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message;

      if (message.includes("Email already")) {
        setErrors((prev) => ({ ...prev, email: "Email already registered" }));
      }
    }
  };

  const handleCloseModal = () => {
    resetFormData();
    onClose();
  };

  const handleOtpModalClose = () => {
    setShowOtpModal(false);
    resetFormData();
    onClose();
  };

  const handleSwitchToLogin = () => {
    resetFormData();
    onSwitchToLogin();
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !showOtpModal}
        onClose={handleCloseModal}
        title="Create Account"
        icon={<UserPlus className="h-6 w-6 text-gray-800" />}
      >
        <div className="space-y-4">
          <Input
            type="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={(value) => {
              setFormData({ ...formData, name: value });
              if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
            }}
            error={errors.name}
          />

          <Input
            type="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={(value) => {
              setFormData({ ...formData, email: value });
              if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
            }}
            error={errors.email}
          />

          <Input
            type="text"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={(value) => {
              setFormData({ ...formData, phone: value });
              if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
            }}
            error={errors.phone}
          />

          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={formData.password}
            onChange={(value) => {
              setFormData({ ...formData, password: value });
              if (errors.password)
                setErrors((prev) => ({ ...prev, password: "" }));
            }}
            error={errors.password}
            rightIcon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            onRightIconClick={() => setShowPassword((prev) => !prev)}
          />

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Select Role
            </label>
            <Toggle
              options={roleOptions}
              selected={formData.role}
              onChange={(value) => setFormData({ ...formData, role: value })}
            />
          </div>

          {formData.role === "mentor" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Upload Verification Document
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file);
                    }
                  }}
                  className="mt-2"
                />
                {errors.mentorDocument && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.mentorDocument}
                  </p>
                )}
              </div>

              <div>
                <Input
                  type="textarea"
                  placeholder="Write your message to the Spokely team..."
                  value={mentorData.textMessage}
                  onChange={(val) => {
                    setMentorData((prev) => ({
                      ...prev,
                      textMessage: val,
                    }));

                    const trimmedVal = val.trim();
                    if (errors.mentorMessage && trimmedVal.length >= 10) {
                      setErrors((prev) => ({ ...prev, mentorMessage: "" }));
                    }
                  }}
                  className="resize-none h-24"
                  error={errors.mentorMessage}
                />
              </div>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <Button variant="google" onClick={handleGoogleSignup}>
              Signup using Google
            </Button>

            <Button variant="primary" onClick={handleCreateAccount}>
              Create Account
            </Button>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={handleSwitchToLogin}
              className="text-gray-800 hover:text-gray-900 font-medium transition-colors"
            >
              Already have an account? Login
            </button>
          </div>
        </div>
      </Modal>

      <OTPModal
        isOpen={showOtpModal}
        onClose={handleOtpModalClose}
        email={formData.email}
        role={formData.role}
      />
    </>
  );
};

export default SignupModal;
