import { useEffect, useState } from "react";
import SearchFilterBar from "../../components/admin/SearchFilterBar";
import DataTable from "../../components/admin/DataTables";
import toast from "react-hot-toast";
import { getAdminTasks } from "../../services/adminService";

interface Feedback {
  feedback: string;
  strengths: string;
  weaknesses: string;
}

interface Section {
  prompt: string;
  userResponse?: any;
  feedback?: Feedback;
}

interface DailyTask {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  topic: string;
  writing: Section;
  reading: Section;
  speaking: Section;
  listening: Section;
}

const FeedbackModal = ({
  open,
  onClose,
  task,
}: {
  open: boolean;
  onClose: () => void;
  task: DailyTask | null;
}) => {
  if (!open || !task) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-11/12 max-w-2xl p-6 relative shadow-lg">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 font-bold"
        >
          X
        </button>
        <h2 className="text-xl font-bold mb-4">Feedback for {task.topic}</h2>

        {["writing", "reading", "speaking", "listening"].map((section) => {
          const secData = task[section as keyof DailyTask] as Section;
          return (
            <div key={section} className="mb-4 border-b pb-2">
              <h3 className="font-semibold capitalize">{section}</h3>
              <p>
                <strong>Feedback:</strong>{" "}
                {secData.feedback?.feedback || "No feedback"}
              </p>
              <p>
                <strong>Strengths:</strong>{" "}
                {secData.feedback?.strengths || "N/A"}
              </p>
              <p>
                <strong>Weaknesses:</strong>{" "}
                {secData.feedback?.weaknesses || "N/A"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DailyTaskManagement = () => {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All Topics");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedTask, _setSelectedTask] = useState<DailyTask | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const limit = 10;

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await getAdminTasks({
          search,
          topic: filter === "All Topics" ? undefined : filter,
          page,
          limit,
        });
        
        const { tasks: fetchedTasks, total: totalTasks } = response.data;
        setTasks(fetchedTasks);
        setTotal(totalTasks);
      } catch (err) {
        console.error("Error fetching tasks:", err);
        toast.error("Failed to fetch tasks");
      }
    };

    fetchTasks();
  }, [search, filter, page]);

  // Open feedback modal when a row is clicked
  const handleTaskClick = (id: string) => {
    window.location.href = `/admin/task/${id}`;
  };

  const taskData = tasks.map((task) => ({
    id: task.id,
    dailyTask: task.topic,
    user: {
      name: task.user.name,
      email: task.user.email,
    },
    writing: task.writing.userResponse || "Pending",
    reading: task.reading.userResponse ? "Completed" : "Pending",
    speaking: task.speaking.userResponse ? "Completed" : "Pending",
    listening: task.listening.userResponse ? "Completed" : "Pending",
    status:
      task.writing.userResponse ||
      task.reading.userResponse ||
      task.speaking.userResponse ||
      task.listening.userResponse
        ? "Completed"
        : "Pending",
  }));

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="w-16 h-1 bg-purple-500 rounded-full mb-2"></div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Daily Task Management
          </h1>
          <p className="text-sm text-gray-600">
            View, search, and manage daily tasks of all users
          </p>
        </div>
      </div>

      <div className="text-black">
        <SearchFilterBar
          searchPlaceholder="Search by topic or user ID"
          filterOptions={["All Topics", "Environment", "Education"]}
          hideMoreFilters={true}
          hideStatusFilter={true}
          onSearch={setSearch}
          onFilter={setFilter}
        />
      </div>

      <DataTable
        data={taskData}
        type="dailyTask"
        onRowClick={handleTaskClick}
        page={page}
        setPage={setPage}
        total={total}
        limit={limit}
      />

      <FeedbackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        task={selectedTask}
      />
    </div>
  );
};

export default DailyTaskManagement;
