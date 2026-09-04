import { useEffect, useState } from "react";
import { Search, X, ArrowLeft } from "lucide-react";
import Input from "../../modals/Input";
import { createSession } from "../../services/sessionService";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { getAllConnections } from "../../services/connectionService";
import { useAuthStore } from "../../store/userAuthStore";
import Header from "../user/DashBoardComponents/Header";

interface FormData {
  type: string;
  topic: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface FormErrors {
  topic: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  participants: string;
  form: string;
}

const ScheduleSession = () => {
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { user } = useAuthStore();
  const userRole = user?.role;

  const [formData, setFormData] = useState<FormData>({
    type: "peer-to-peer",
    topic: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
  });

  const [errors, setErrors] = useState<FormErrors>({
    topic: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    participants: "",
    form: "",
  });

  const navigate = useNavigate();

  async function connectedUsers() {
    try {
      let res = await getAllConnections();
      return res;
    } catch (err) {
      toast.error("Failed to fetch users");
      return { data: [] };
    }
  }

  useEffect(() => {
    connectedUsers().then((res) => {
      const list = res.data?.connections || [];

      const unblocked = list.filter((conn: any) => !conn.isBlocked);

      const formatted = unblocked.map((conn: any) => {
        if (conn.user.id === user?.id) {
          return { ...conn, otherUser: conn.connectedUser };
        } else if (conn.connectedUser.id === user?.id) {
          return { ...conn, otherUser: conn.user };
        } else {
          return conn;
        }
      });

      setUsers(formatted);
    });
  }, []);


  const calculateEndTime = (startTime: string) => {
    if (!startTime) return "";
    const [hours, minutes] = startTime.split(":").map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    return `${endDate.getHours().toString().padStart(2, "0")}:${endDate
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  const validateField = (field: string, value: string, formData: FormData) => {
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().slice(0, 5);

    switch (field) {
      case "topic":
        if (!value.trim()) return "Topic is required";
        if (value.trim().length < 3)
          return "Topic must be at least 3 characters long";
        if (value.trim().length > 100)
          return "Topic must be less than 100 characters";
        return "";
      case "description":
        if (!value.trim()) return "Description is required";
        if (value.trim().length < 10)
          return "Description must be at least 10 characters long";
        if (value.trim().length > 500)
          return "Description must be less than 500 characters";
        return "";
      case "date":
        if (!value) return "Date is required";
        const selectedDate = new Date(value);
        if (isNaN(selectedDate.getTime())) return "Please enter a valid date";
        if (value < currentDate) return "Date cannot be in the past";
        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 6);
        if (selectedDate > maxDate)
          return "Cannot schedule more than 6 months in advance";
        return "";
      case "startTime":
        if (!value) return "Start time is required";
        if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value))
          return "Please enter a valid time format (HH:MM)";
        if (formData.date) {
          const startDateTime = new Date(`${formData.date}T${value}`);
          if (isNaN(startDateTime.getTime())) return "Invalid start time";
          if (formData.date === currentDate && value <= currentTime)
            return "Start time cannot be in the past";
        }
        return "";
      case "endTime":
        if (!value) return "End time is required";
        if (formData.startTime && formData.date) {
          const startDateTime = new Date(
            `${formData.date}T${formData.startTime}`
          );
          const endDateTime = new Date(`${formData.date}T${value}`);
          if (endDateTime <= startDateTime)
            return "End time must be after start time";
          const expectedEndTime = calculateEndTime(formData.startTime);
          if (value !== expectedEndTime)
            return "All sessions are limited to 1 hour duration";
        }
        return "";
      default:
        return "";
    }
  };

  const validateParticipants = (participants: any[]) => {
    if (participants.length === 0)
      return "Please select at least one participant";
    if (participants.length > 10) return "Maximum 10 participants allowed";
    return "";
  };

  const validateForm = (formData: FormData, participants: any[]) => {
    const fieldErrors: Partial<FormErrors> = {};
    Object.keys(formData).forEach((field) => {
      if (field !== "type") {
        const error = validateField(
          field,
          formData[field as keyof FormData] || "",
          formData
        );
        if (error) fieldErrors[field as keyof FormErrors] = error;
      }
    });
    const participantError = validateParticipants(participants);
    if (participantError) fieldErrors.participants = participantError;
    return fieldErrors;
  };

  useEffect(() => {
    const formErrors = validateForm(formData, selectedMembers);
    const filteredErrors: Partial<FormErrors> = {};
    Object.keys(formErrors).forEach((key) => {
      if (touched[key] || key === "form") {
        filteredErrors[key as keyof FormErrors] =
          formErrors[key as keyof FormErrors];
      }
    });
    setErrors((prev) => ({ ...prev, ...filteredErrors }));
  }, [formData, selectedMembers, touched]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => {
      const newFormData = { ...prev, [field]: value };
      if (field === "startTime" && value) {
        newFormData.endTime = calculateEndTime(value);
      }
      return newFormData;
    });
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const addMember = (member: any) => {
    if (
      !selectedMembers.find((m) => m.otherUser?.id === member.otherUser?.id)
    ) {
      setSelectedMembers((prev) => [...prev, member]);
    }
    setSearchTerm("");
    setTouched((prev) => ({ ...prev, participants: true }));
  };

  const removeMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.filter((m) => m.otherUser?.id !== userId)
    );
    setTouched((prev) => ({ ...prev, participants: true }));
  };

  const handleSchedule = async () => {
    try {
      const formErrors = validateForm(formData, selectedMembers);
      if (Object.keys(formErrors).length > 0) {
        setErrors((prev) => ({
          ...prev,
          ...formErrors,
          form: "Fix highlighted errors",
        }));
        toast.error("Please fix all validation errors before scheduling");
        return;
      }

      const { type, topic, description, date, startTime, endTime } = formData;
      const start = new Date(`${date}T${startTime}`);
      const end = new Date(`${date}T${endTime}`);

      const capitalizeFirstLetter = (str: string) =>
        str.charAt(0).toUpperCase() + str.slice(1);

      const payload: any = {
        type,
        topic: topic.trim(),
        description: description.trim(),
        startTime: start,
        endTime: end,
        participants: selectedMembers.map((m) => ({
          user: m.otherUser?.id,
          status: "pending",
        })),
        role: capitalizeFirstLetter(userRole as string),
      };

      await createSession(payload);
      toast.success("Session scheduled successfully");
      navigate("/user/session");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to schedule session");
    }
  };

  const filteredResults = users.filter((member) =>
    member.otherUser?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isFormValid = () => {
    const hasRequiredFields = Object.entries(formData).every(([key, value]) => {
      if (key === "type") return true;
      return value.trim() !== "";
    });
    const noFieldErrors = Object.values(
      validateForm(formData, selectedMembers)
    ).every((err) => !err);
    return hasRequiredFields && noFieldErrors;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white py-20">
      {/* Header */}
      <Header />
      <div className="max-w-7xl mx-auto px-6 flex items-center mb-12 py-10">
        <button
          onClick={() => navigate(-1)}
          className="p-3 rounded-full bg-gradient-to-r from-gray-700 to-gray-800 border border-gray-700 shadow-md hover:scale-105 hover:shadow-lg transition-all"
        >
          <ArrowLeft size={20} className="text-gray-300" />
        </button>
        <h1 className="text-3xl font-bold ml-4 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text tracking-tight text-white">
          Schedule Peer-to-Peer Session
        </h1>
      </div>

      {/* Form */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl shadow-xl border border-white/10 p-8">
          {errors.form && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/40 rounded-lg text-sm text-red-300">
              {errors.form}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Date <span className="text-red-400">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(val) => handleInputChange("date", val)}
                  onBlur={() => handleBlur("date")}
                  className="bg-gray-900/60 text-white"
                />
                {errors.date && touched.date && (
                  <p className="text-red-400 text-xs mt-1">{errors.date}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Start Time <span className="text-red-400">*</span>
                  </label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(val) => handleInputChange("startTime", val)}
                    onBlur={() => handleBlur("startTime")}
                    className="bg-gray-900/60 text-white"
                  />
                  {errors.startTime && touched.startTime && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.startTime}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    End Time <span className="text-red-400">*</span>
                  </label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    disabled
                    className="bg-gray-700 text-gray-400"
                    onChange={() => {}}
                  />
                  {errors.endTime && touched.endTime && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.endTime}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Topic <span className="text-red-400">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Enter session topic"
                  value={formData.topic}
                  onChange={(val) => handleInputChange("topic", val)}
                  onBlur={() => handleBlur("topic")}
                  className="bg-gray-900/60 text-white"
                />
                {errors.topic && touched.topic && (
                  <p className="text-red-400 text-xs mt-1">{errors.topic}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  onBlur={() => handleBlur("description")}
                  className="w-full px-4 py-3 bg-gray-900/60 text-white rounded-xl border border-gray-700 focus:ring-2 focus:ring-green-500"
                  rows={4}
                  placeholder="Describe session goals..."
                />
                {errors.description && touched.description && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.description}
                  </p>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Add Participants <span className="text-red-400">*</span>
                </label>

                <div className="relative mb-4">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <Input
                    type="text"
                    placeholder="Search by name"
                    value={searchTerm}
                    onChange={(val) => setSearchTerm(val)}
                    className="pl-10 bg-gray-900/60 text-white placeholder-gray-400"
                  />
                </div>

                {searchTerm && filteredResults.length > 0 && (
                  <div className="bg-gray-900/50 border border-gray-700 rounded-xl max-h-40 overflow-y-auto mb-4">
                    {filteredResults.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => addMember(member)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-800 flex items-center justify-between"
                      >
                        <span className="text-sm">
                          {member.otherUser?.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          Click to add
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {selectedMembers.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      Selected Participants ({selectedMembers.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between bg-gray-800/60 px-3 py-2 rounded-lg"
                        >
                          <span className="text-sm">
                            {member.otherUser?.name}
                          </span>
                          <button
                            onClick={() => removeMember(member.otherUser?.id)}
                            className="text-red-400 hover:text-red-600 p-1"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {errors.participants && touched.participants && (
                  <p className="text-red-400 text-xs mt-2">
                    {errors.participants}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-10 border-t border-gray-800 pt-6">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 rounded-full bg-gray-800 border border-gray-700 text-gray-300 hover:text-white hover:scale-105 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSchedule}
              disabled={!isFormValid()}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Schedule Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleSession;
