import { useEffect, useState } from "react";
import SearchFilterBar from "../../components/admin/SearchFilterBar";
import DataTable from "../../components/admin/DataTables";
import { getAllMentors, updateMentorStatus } from "../../services/adminService";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const MentorManagement = () => {
  const [mentors, setMentors] = useState<any[]>([]);
  const [_loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortFilter, setSortFilter] = useState("All Mentors");

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        setLoading(true);

        const params: any = {
          page,
          limit,
          search,
        };

        if (statusFilter === "active") params.isBlocked = false;
        else if (statusFilter === "blocked") params.isBlocked = true;

        if (sortFilter === "Most Students") params.sortBy = "students";
        else if (sortFilter === "Sessions") params.sortBy = "sessions";
        else if (sortFilter === "Verification Pendings")
          params.verificationStatus = "pending";

        const res = await getAllMentors(params);

        const { mentors, total } = res.data.result;

        setMentors(mentors ?? []);
        setTotal(total ?? 0);
      } catch (err) {
        console.error("Error fetching mentors:", err);
        toast.error("Failed to fetch mentors.");
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, [page, search, statusFilter, sortFilter]);

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleFilter = (val: string) => {
    setSortFilter(val);
    setPage(1);
  };

  const handleStatusFilter = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };

  const handleBlock = async (id: string) => {
    try {
      const mentor = mentors.find((m) => m._id === id);

      if (!mentor) {
        toast.error("Mentor not found");
        return;
      }

      const newStatus = mentor.isBlocked ? "unBlocked" : "blocked";
      await updateMentorStatus(id, newStatus);

      setMentors((prev) =>
        prev.map((m) => (m._id === id ? { ...m, isBlocked: !m.isBlocked } : m))
      );

      toast.success(
        `Mentor ${
          newStatus === "blocked" ? "blocked" : "unblocked"
        } successfully`
      );
    } catch (err) {
      console.error("Error updating mentor status:", err);
      toast.error("Failed to update mentor status");
    }
  };

  const handleMentorClick = (id: string) => {
    navigate(`/admin/mentors/verification/${id}`);
  };

  const mentorData = (mentors || []).map((mentor) => ({
    id: mentor._id,
    name: mentor.name,
    email: mentor.email,
    students: mentor.studentsCount || 0,
    status: mentor.isBlocked ? "Blocked" : "Active",
    sessions: mentor.sessionsDone || 0,
    avatar: mentor.profilePicture || undefined,
    verificationStatus: mentor.document?.verificationStatus ?? "old doc",
    isBlocked: mentor.isBlocked,
  }));

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="w-16 h-1 bg-yellow-500 rounded-full mb-2"></div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Mentor Management
          </h1>
          <p className="text-sm text-gray-600">
            Manage and monitor all platform mentors
          </p>
        </div>
      </div>

      <div className="text-black">
        <SearchFilterBar
          searchPlaceholder="Search mentors by name or email"
          filterOptions={[
            "All Mentors",
            "Verification Pendings",
            "Most Students",
            "Sessions",
          ]}
          onSearch={handleSearch}
          onFilter={handleFilter}
          onStatusFilter={handleStatusFilter}
          hideMoreFilters={true}
        />
      </div>

      <DataTable
        data={mentorData}
        type="mentor"
        onBlock={handleBlock}
        onRowClick={handleMentorClick}
        onDelete={(id) => (window.location.href = `/mentor-profile/${id}`)}
        page={page}
        setPage={setPage}
        total={total}
        limit={limit}
      />
    </div>
  );
};

export default MentorManagement;
