import { useEffect, useState } from "react";
import { Search, Plus } from "lucide-react";
import Button from "../../modals/Button";
import Input from "../../modals/Input";
import Badge from "../../components/common/Badge";
import DashboardHeader from "./DashBoardComponents/Header";
import { getUserSubscriptions } from "../../services/subscriptionService";
import { useAuthStore } from "../../store/userAuthStore";
import { useNavigate } from "react-router-dom";

interface Mentor {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
  sessionsDone: number;
  tags: string[];
}

interface Subscription {
  _id: string;
  userId: string;
  mentorId: string | Mentor;
  mentor: Mentor;
  plan: string;
  price: number;
  status: "ACTIVE" | "CANCELLED" | "EXPIRED";
  startDate: string;
  sessionsCount: number;
  sessionsByUser: number;
  avgRating: number | null;
}

const SpokelyMentors = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const status = ["ACTIVE", "CANCELLED", "EXPIRED"];
  const userId = useAuthStore((state) => state.user?.id!);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getUserSubscriptions(
          userId as string,
          debouncedSearch,
          selectedStatus,
          page,
          6
        );

        const { data, totalPages } = res.data;
        setSubscriptions(data || []);
        setTotalPages(totalPages || 1);
      } catch (error) {
        console.error("Error fetching subscriptions:", error);
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchData();
  }, [userId, debouncedSearch, selectedStatus, page]);

  const MentorCard = ({ sub }: { sub: Subscription }) => {
    const mentor = sub.mentor;
    return (
      <div className="backdrop-blur-lg bg-white/10 border border-white/10 rounded-2xl p-6 text-white shadow-lg transition hover:scale-[1.02] hover:border-emerald-500">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center overflow-hidden mr-3">
            {mentor?.profilePicture ? (
              <img
                src={mentor.profilePicture}
                alt={mentor.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-semibold text-lg">
                {mentor?.name?.[0] || "?"}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{mentor?.name}</h3>
            <Badge variant="peer" size="sm">
              {sub.status}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-center">
          <div>
            <div className="text-green-400 text-xl font-bold">
              {sub.sessionsCount ?? 0}
            </div>
            <div className="text-gray-400 text-xs">Sessions</div>
          </div>
          <div>
            <div className="text-green-400 text-xl font-bold">
              {sub.avgRating ? sub.avgRating.toFixed(1) : "—"}
            </div>
            <div className="text-gray-400 text-xs">Avg Rating</div>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={() => navigate(`/mentor-profile/${mentor._id}`)}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full hover:shadow-lg transition-all"
        >
          View Details
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white py-24 transition-all duration-300">
      <DashboardHeader />

      <div className="max-w-7xl mx-auto px-6 pt-6 flex justify-between items-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent tracking-tight">
          Your Mentors
        </h2>

        <Button
          variant="primary"
          className="px-6 py-3 text-base bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transform transition-all"
          onClick={() => navigate("/user/public/mentors")}
        >
          <Plus size={18} className="mr-2" />
          Add Mentor
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative max-w-md flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10"
              size={20}
            />
            <Input
              type="text"
              placeholder="Search mentors by ID or name..."
              value={searchTerm}
              onChange={setSearchTerm}
              className="pl-12 pr-4 py-3 text-sm border border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-800 text-white placeholder-gray-400 shadow-md"
            />
          </div>

          <div className="flex gap-2">
            <Button
              key="All"
              variant={selectedStatus === "All" ? "success" : "secondary"}
              onClick={() => {
                setSelectedStatus("All");
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-700 rounded-full focus:outline-none text-sm"
            >
              All
            </Button>
            {status.map((level) => (
              <Button
                key={level}
                variant={selectedStatus === level ? "success" : "secondary"}
                onClick={() => {
                  setSelectedStatus(level);
                  setPage(1);
                }}
                className="px-4 py-2 border border-gray-700 rounded-full focus:outline-none text-sm"
              >
                {level}
              </Button>
            ))}
          </div>
        </div>

        {/* Mentor Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 border-4 border-gray-700 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-gray-400 font-medium text-lg">
              Loading mentors...
            </div>
          </div>
        ) : subscriptions.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subscriptions.map((sub) => (
                <MentorCard key={sub._id} sub={sub} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 0 && (
              <div className="flex justify-center items-center gap-4 mt-10">
                <Button
                  variant="secondary"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-full"
                >
                  Previous
                </Button>
                <span className="text-gray-400 text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="secondary"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-full"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 text-gray-400">
            No mentors found — try changing filters or search terms.
          </div>
        )}
      </div>
    </div>
  );
};

export default SpokelyMentors;
