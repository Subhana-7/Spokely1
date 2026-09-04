import React from "react";
import Modal from "./Modal";
import { CheckCircle } from "lucide-react";
import Button from "./Button";

interface PasswordResetSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PasswordResetSuccessModal: React.FC<PasswordResetSuccessModalProps> = ({
  isOpen,
  onClose,
}) => {

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Password Reset Successful"
      icon={<CheckCircle className="h-6 w-6 text-green-600" />}
    >
      <div className="space-y-4 text-center">
        <p className="text-gray-700">
          Your password has been successfully reset.
        </p>
        <Button variant="primary" onClick={onClose}>
          Proceed to Login
        </Button>
      </div>
    </Modal>
  );
};

export default PasswordResetSuccessModal;
