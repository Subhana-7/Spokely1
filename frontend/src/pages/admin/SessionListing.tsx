import { useEffect, useState } from "react";
import SearchFilterBar from "../../components/admin/SearchFilterBar";
import DataTable from "../../components/admin/DataTables";
import { adminSessionListing } from "../../services/adminService";
import toast from "react-hot-toast";

interface SessionItem {
  id: string;
  topic: string;
  type: string;
  status: string;
  mentor: { name: string; email: string };
  participants: { name: string; status: string }[];
  startTime: string;
  endTime?: string;
  feedbackCount?: number;
  flagsCount?: number;
}

const AdminSessionsPage = () => {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const limit = 10;
  const [sessionType, setSessionType] = useState("all");

  const fetchSessions = async () => {
    try {
      setLoading(true);

      const { data } = await adminSessionListing({
        page,
        limit,
        search: searchTerm,
        status: statusFilter,
        type: sessionType,
      });

      const rawSessions = data.sessions || [];

      setSessions(
        rawSessions.map((s: any) => ({
          id: s._id,
          topic: s.topic,
          type: s.type,
          status: s.status,
          mentor: s.createdBy || { name: "Unknown", email: "-" },
          participants:
            s.participants?.map((p: any) => ({
              name: p.user?.name || "N/A",
              status: p.status || "-",
            })) || [],
          startTime: s.startTime,
          endTime: s.endTime,
          feedbackCount: s.feedback?.length || 0,
          flagsCount: s.flags?.length || 0,
        }))
      );

      setTotal(data.total || 0);
    } catch (err: any) {
      console.error("Failed to fetch sessions:", err);
      toast.error(err?.response?.data?.message || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (val: string) => {
    setSearchTerm(val);
    setPage(1);
  };

  const handleStatus = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };

  const handleTypeFilter = (val: string) => {
    setSessionType(val);
    setPage(1);
  };

  useEffect(() => {
    fetchSessions();
  }, [page, searchTerm, statusFilter, sessionType]);


  return (
    <div className="p-4 md:p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="w-16 h-1 bg-green-500 rounded-full mb-2"></div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Session Management
          </h1>
          <p className="text-sm text-gray-600">
            Manage and monitor all platform sessions
          </p>
        </div>
      </div>

      {/* Search + Filter Bar */}
      <div className="text-black">
        <SearchFilterBar
          searchPlaceholder="Search sessions by topic or mentor"
          onSearch={handleSearch}
          onStatusFilter={handleStatus}
          onFilter={handleTypeFilter}
          hideMoreFilters={true}
          filterOptions={["all", "public", "private", "peer-to-peer"]}
          statusOptions={[
            { label: "All Sessions", value: "all" },
            { label: "Upcoming", value: "upcoming" },
            { label: "Ongoing", value: "ongoing" },
            { label: "Completed", value: "completed" },
            { label: "Cancelled", value: "cancelled" },
          ]}
        />
      </div>

      {/* Data Table Section */}
      {loading ? (
        <div className="p-10 text-center text-gray-500">
          Loading sessions...
        </div>
      ) : sessions.length === 0 ? (
        <div className="p-10 text-center text-gray-500">No sessions found</div>
      ) : (
        <DataTable
          data={sessions.map((s) => ({
            id: s.id,
            topic: s.topic,
            type: s.type,
            status: s.status,
            feedbackCount: s.feedbackCount || 0,
          }))}
          type="session"
          page={page}
          setPage={setPage}
          total={total}
          limit={limit}
          onRowClick={(id) => (window.location.href = `/session/details/${id}`)}
          onDelete={() => {
            toast("Delete session feature coming soon", { icon: "🗑️" });
          }}
        />
      )}
    </div>
  );
};

export default AdminSessionsPage;
