import { useState, useEffect } from "react";
import DashboardHeader from "./DashBoardComponents/Header";
import SpokelyCard from "../../components/common/Cards";
import {
  Award,
  Camera,
  Edit,
  Star,
  TrendingUp,
  Zap,
  Lock,
  Users,
  BookOpen,
  Layers,
  Activity,
} from "lucide-react";
import Badge from "../../components/common/Badge";
import { useAuthStore } from "../../store/userAuthStore";
import {
  editUserDetails,
  changePassword,
  getUserStats,
} from "../../services/authServices";
import { uploadImageToCloudinary } from "../../utilis/cloudinary ";
import ChangePasswordModal from "../../modals/ChangePassword";
import SuccessModal from "../../modals/SuccessModal";
import toast from "react-hot-toast";

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { user, setUser } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || "John Doe",
    email: user?.email || "john@example.com",
    phone: user?.phone ? String(user.phone) : "9876543210",
    uniqueCode: user?.uniqueCode || "USR-12345",
    profilePicture:
      user?.profilePicture ||
      "https://avatars.githubusercontent.com/u/000000?v=4",
  });

  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const data = await getUserStats();
        setStats(data);
      } catch (error) {
        toast.error("Failed to load profile stats");
        console.error(error);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfilePicUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const url = await uploadImageToCloudinary(file);
      setFormData((prev) => ({ ...prev, profilePicture: url }));
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id || !user?.role) {
      toast.error("User information missing!");
      return;
    }

    try {
      setLoading(true);
      const updated = await editUserDetails(user.id, "user", formData);
      setUser(updated);
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      toast.error("Failed to update profile");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (oldPass: string, newPass: string) => {
    if (!user?.id) {
      toast.error("User not logged in!");
      return;
    }

    try {
      await changePassword("user", {
        currentPassword: oldPass,
        newPassword: newPass,
        id: user.id,
      });
      setIsPasswordModalOpen(false);
      setIsSuccessModalOpen(true);
    } catch (err) {
      toast.error("Failed to change password");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white bg-gray-900">
        <DashboardHeader />
        <p className="mt-10 text-lg text-gray-300">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white py-24">
      <DashboardHeader />

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent tracking-tight">
              Your Profile
            </h1>
            <p className="text-gray-400">
              View and manage your learning journey
            </p>
          </div>

          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            {["overview", "settings"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg capitalize transition-all ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Section */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Profile Card */}
            <div className="xl:col-span-1">
              <SpokelyCard className="p-8 backdrop-blur-lg bg-white/10 border border-white/10 rounded-2xl shadow-lg">
                <div className="text-center">
                  <div className="relative mb-6">
                    <div className="w-32 h-32 rounded-full border-4 border-emerald-500 mx-auto overflow-hidden">
                      <img
                        src={formData.profilePicture}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {isEditing && (
                      <label className="absolute bottom-0 right-1/2 transform translate-x-1/2 translate-y-2 bg-gray-800 border border-gray-700 rounded-full p-2 shadow cursor-pointer">
                        <Camera size={16} className="text-gray-300" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePicUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  <h2 className="text-2xl font-bold mb-2 text-white">
                    {formData.name}
                  </h2>
                  <button
                    className="text-xl p-1 text-blue-100"
                  >
                     {user.email}
                  </button>

                  {statsLoading ? (
                    <div className="text-gray-400 text-sm">
                      Loading streak...
                    </div>
                  ) : (
                    <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/30 mb-6">
                      <div className="flex justify-center items-center gap-2 text-green-400">
                        <Zap size={18} />{" "}
                        <span>{user.uniqueCode} - User Code</span>
                      </div>
                    </div>
                  )}
                </div>
              </SpokelyCard>
            </div>

            {/* Stats Section */}
            <div className="xl:col-span-3">
              {statsLoading ? (
                <div className="flex justify-center items-center h-64 text-gray-300">
                  Loading your progress...
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    {
                      label: "Sessions Completed",
                      value: stats?.sessionsDone ?? 0,
                      icon: <BookOpen size={22} />,
                    },
                    {
                      label: "Levels Achieved",
                      value: stats?.levels ?? 0,
                      icon: <Layers size={22} />,
                    },
                    {
                      label: "Mentors Subscribed",
                      value: stats?.mentorsSubscribed ?? 0,
                      icon: <Award size={22} />,
                    },
                    {
                      label: "Connections",
                      value: stats?.totalConnections ?? 0,
                      icon: <Users size={22} />,
                    },
                    {
                      label: "Daily Tasks",
                      value: stats?.dailyTasksCompleted ?? 0,
                      icon: <Activity size={22} />,
                    },
                    {
                      label: "Completion Rate",
                      value: `${stats?.completionRate ?? 0}%`,
                      icon: <TrendingUp size={22} />,
                    },
                  ].map((item, idx) => (
                    <SpokelyCard
                      key={idx}
                      className="p-6 backdrop-blur-lg bg-white/10 border border-white/10 text-center rounded-2xl hover:shadow-green-500/20 transition-all duration-300"
                    >
                      <div className="flex flex-col items-center">
                        <div className="mb-3 text-green-400">{item.icon}</div>
                        <div className="text-3xl font-bold mb-1 text-white">
                          {item.value}
                        </div>
                        <p className="text-sm text-gray-400 font-medium">
                          {item.label}
                        </p>
                      </div>
                    </SpokelyCard>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Section */}
        {activeTab === "settings" && (
          <div className="max-w-3xl mx-auto mt-10">
            <SpokelyCard className="p-8 backdrop-blur-lg bg-white/10 border border-white/10 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">
                  Account Settings
                </h3>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg"
                  >
                    <Edit size={16} className="mr-2" /> Edit
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center px-4 py-2 bg-green-600 rounded-lg text-white"
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Full Name
                  </label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    readOnly={!isEditing}
                    className={`w-full p-3 rounded-xl text-white ${
                      isEditing
                        ? "bg-gray-800 border border-green-500/30 focus:ring-2 focus:ring-green-500"
                        : "bg-gray-900 border border-gray-800"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Email
                  </label>
                  <input
                    value={formData.email}
                    readOnly
                    className="w-full p-3 rounded-xl bg-gray-900 border border-gray-800 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Phone
                  </label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    readOnly={!isEditing}
                    className={`w-full p-3 rounded-xl text-white ${
                      isEditing
                        ? "bg-gray-800 border border-green-500/30 focus:ring-2 focus:ring-green-500"
                        : "bg-gray-900 border border-gray-800"
                    }`}
                  />
                </div>

                <button
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-medium hover:shadow-green-500/20 transition-all"
                >
                  <Lock size={16} className="mr-2 inline" /> Change Password
                </button>
              </div>
            </SpokelyCard>
          </div>
        )}
      </main>

      {/* Modals */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSubmit={handlePasswordChange}
      />
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        message="Password updated successfully!"
      />
    </div>
  );
};

export default UserProfile;
