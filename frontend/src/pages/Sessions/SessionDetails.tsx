import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  User,
  DollarSign,
  PlayCircle,
  Star,
} from "lucide-react";
import Button from "../../modals/Button";
import Card from "../../components/common/Cards";
import Badge from "../../components/common/Badge";
import Input from "../../modals/Input";
import { getSessionById, addFeedback } from "../../services/sessionService";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/userAuthStore";
import Header from "../user/DashBoardComponents/Header";
import MentorHeader from "../mentor/DashboardComponents/Header";

const SessionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [feedbackModal, setFeedbackModal] = useState<{
    open: boolean;
    toUserId?: string;
  }>({
    open: false,
  });

  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackRating, setFeedbackRating] = useState<number | "">("");
  const [viewFeedbackModal, setViewFeedbackModal] = useState<{
    open: boolean;
    feedback?: any;
  }>({
    open: false,
  });

  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = currentUser?.id;

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await getSessionById(id!);
        setSession(res.data);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to load session");
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [id]);


  const handleSubmitFeedback = async () => {
    if (!feedbackComment.trim() || !feedbackRating || !feedbackModal.toUserId) {
      toast.error("Please fill feedback and rating");
      return;
    }
    try {
      const res = await addFeedback(session._id, {
        to: feedbackModal.toUserId,
        comment: feedbackComment,
        rating: Number(feedbackRating),
      });
      setSession(res.data.session);
      toast.success("Feedback submitted successfully!");
      setFeedbackModal({ open: false });
      setFeedbackComment("");
      setFeedbackRating("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit feedback");
    }
  };

  const hasGivenFeedback = (toUserId: string) =>
    session.feedback?.find(
      (f: any) =>
        String(f.from) === String(currentUserId) &&
        String(f.to) === String(toUserId)
    );

  const handleViewFeedback = (toUserId: string) => {
    const feedback = hasGivenFeedback(toUserId);
    if (feedback) setViewFeedbackModal({ open: true, feedback });
  };

  if (loading)
    return (
      <div className="p-6 text-center text-gray-300 text-lg bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen">
        Loading session details...
      </div>
    );
  if (!session)
    return (
      <div className="p-6 text-center text-red-500 bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen">
        Session not found.
      </div>
    );

  let participants = session.participants?.map((p: any) => p.user) || [];
  if (
    session.createdBy &&
    !participants.some((u: any) => u._id === session.createdBy._id)
  ) {
    participants = [session.createdBy, ...participants];
  }

  const statusColors: Record<string, string> = {
    completed: "bg-green-500/20 text-white border border-green-500/30",
    upcoming: "bg-gray-500/20 text-white border border-gray-500/30",
    cancelled: "bg-red-500/20 text-white border border-red-500/30",
    ongoing: "bg-blue-500/20 text-white border border-blue-500/30",
  };

  const goToProfile = (user: any) => {
    if (user.role === "mentor") {
      navigate(`/mentor-profile/${user._id}`);
    } else {
      navigate(`/user-profile/${user._id}`);
    }
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white ${
        currentUser?.role === "user" ? "pt-13" : ""
      }`}
    >
      {/* Headers */}
      {currentUser?.role === "user" && <Header />}
      {currentUser?.role === "mentor" && <MentorHeader />}
      {/* admin → nothing shown */}

      <div className="flex items-center max-w-7xl mx-auto px-6 mb-10 py-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors mr-4"
        >
          <ArrowLeft size={22} />
        </button>

        <h1 className="text-3xl font-bold bg-gradient-to-r from-white-400 to-emerald-500 bg-clip-text text-white">
          Session Details
        </h1>
      </div>

      {/* SINGLE COLUMN CLEAN LAYOUT */}
      <div className="max-w-4xl mx-auto px-6 flex flex-col gap-8">
        {/* SESSION DETAILS */}
        <Card className="backdrop-blur-lg bg-white/6 border border-yellow-400/20 rounded-2xl p-6 text-white">
          <div className="text-center mb-5">
            <h2 className="text-3xl font-bold">{session.topic}</h2>
            <p className="text-gray-400 mt-2 text-sm">{session.description}</p>

            <div className="flex justify-center gap-3 mt-3">
              <Badge className={statusColors[session.status]}>
                {session.status}
              </Badge>
              <Badge className="bg-blue-500/20 text-white border border-blue-500/30">
                {session.type}
              </Badge>
            </div>
          </div>

          {/* Info */}
          <div className="grid grid-cols-3 gap-3 text-center mb-4">
            {[
              {
                label: "Start",
                icon: <Clock className="mx-auto text-yellow-400 mb-1" />,
                value: new Date(session.startTime).toLocaleTimeString(),
              },
              {
                label: "End",
                icon: <Clock className="mx-auto text-green-400 mb-1" />,
                value: session.endTime
                  ? new Date(session.endTime).toLocaleTimeString()
                  : "Not Ended",
              },
              {
                label: "Date",
                icon: <Clock className="mx-auto text-blue-400 mb-1" />,
                value: new Date(session.startTime).toLocaleDateString(),
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-gray-800/55 rounded-xl p-3 border border-gray-700/20"
              >
                {item.icon}
                <p className="text-xs text-gray-400">{item.label}</p>
                <p className="font-semibold">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Fee + Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/60 p-3 rounded-lg flex items-center gap-2">
              <DollarSign className="text-green-400" /> Fee: $
              {session.sessionFee || 0}
            </div>
            <div className="bg-gray-800/60 p-3 rounded-lg flex items-center gap-2">
              <Clock className="text-pink-400" /> Duration:{" "}
              {session.durationMinutes || 60} mins
            </div>
          </div>

          {session.recordingLink && (
            <Button
              variant="primary"
              className="w-full mt-6 bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center gap-2"
            >
              <PlayCircle /> Watch Recording
            </Button>
          )}
        </Card>

        {/* Created By */}
        {session.createdBy && (
          <div
            onClick={() => goToProfile(session.createdBy)}
            className="cursor-pointer"
          >
            <Card className="cursor-pointer bg-white/6 border border-white/8 hover:bg-white/8 rounded-2xl p-5 flex items-center gap-4 transition">
              <img
                src={
                  session.createdBy.profilePicture ||
                  "https://ui-avatars.com/api/?name=" + session.createdBy.name
                }
                className="w-12 h-12 rounded-full object-cover border border-white/10"
                alt="creator"
              />
              <div>
                <p className="text-sm text-gray-400">Created By</p>
                <p className="font-semibold text-white text-lg">
                  {session.createdBy.name}
                </p>
                <p className="text-xs text-gray-400">
                  {session.createdBy.email}
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Participants */}
        <Card className="bg-white/6 border border-white/8 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-emerald-400">
            <User /> Participants
          </h3>

          {participants.length === 0 ? (
            <p className="text-gray-400">No participants</p>
          ) : (
            <div className="space-y-3">
              {participants.map((u: any, i: number) => {
                const existingFeedback = hasGivenFeedback(u._id);
                return (
                  <div
                    key={i}
                    onClick={() => goToProfile(u)}
                    className="flex items-center justify-between bg-gray-800/55 p-3 rounded-xl hover:bg-gray-800/70 cursor-pointer"
                  >
                    {/* Left */}
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          u.profilePicture ||
                          "https://ui-avatars.com/api/?name=" + u.name
                        }
                        className="w-10 h-10 rounded-full border border-white/10"
                        alt={u.name}
                      />
                      <div>
                        <p className="font-semibold text-white">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>

                    {/* Right Buttons */}
                    {session.status === "completed" &&
                      u._id !== currentUserId && (
                        <>
                          {existingFeedback ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewFeedback(u._id);
                              }}
                              className="text-xs bg-blue-600 px-3 py-1 rounded-lg hover:bg-blue-700"
                            >
                              View Feedback
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFeedbackModal({
                                  open: true,
                                  toUserId: u._id,
                                });
                              }}
                              className="text-xs bg-green-600 px-3 py-1 rounded-lg hover:bg-green-700"
                            >
                              Give Feedback
                            </button>
                          )}
                        </>
                      )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* FEEDBACK RECEIVED — MOVED TO BOTTOM */}
        {session.feedback?.filter(
          (f: any) => String(f.to) === String(currentUserId)
        ).length > 0 && (
          <Card className="bg-white/6 border border-white/8 rounded-2xl p-6 mb-10">
            <h3 className="text-2xl font-bold mb-4 text-emerald-400">
              Feedback Received
            </h3>

            {session.feedback
              .filter((f: any) => String(f.to) === String(currentUserId))
              .map((f: any, idx: number) => {
                const fromUser =
                  participants.find((p: any) => p._id === f.from) || {};

                return (
                  <div
                    key={idx}
                    className="p-4 mb-3 bg-gray-800/55 rounded-xl border border-gray-700"
                  >
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold">
                        {fromUser.name || "Unknown"}
                      </span>
                      <span className="flex items-center gap-1 text-yellow-400">
                        <Star className="w-4 h-4" /> {f.rating}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm">{f.comment}</p>
                  </div>
                );
              })}
          </Card>
        )}
      </div>

      {/* FEEDBACK MODALS — unchanged */}

      {feedbackModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-700 text-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-semibold mb-4 text-emerald-400">
              Give Feedback
            </h2>

            <Input
              type="text"
              placeholder="Enter feedback..."
              value={feedbackComment}
              onChange={setFeedbackComment}
              className="w-full mb-4 bg-gray-800 text-white border-gray-700"
            />

            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={28}
                  onClick={() => setFeedbackRating(star)}
                  className={`cursor-pointer ${
                    star <= (feedbackRating || 0)
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-gray-600 hover:text-yellow-400"
                  }`}
                />
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setFeedbackModal({ open: false })}
              >
                Close
              </Button>
              <Button variant="primary" onClick={handleSubmitFeedback}>
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}

      {viewFeedbackModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-700 text-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-semibold mb-4 text-emerald-400">
              Your Feedback
            </h2>

            {viewFeedbackModal.feedback && (
              <>
                <div className="flex gap-1 mb-3 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={22}
                      className={
                        star <= viewFeedbackModal.feedback.rating
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-gray-600"
                      }
                    />
                  ))}
                </div>

                <p className="bg-gray-800 text-gray-300 rounded-lg p-3 border border-gray-700">
                  {viewFeedbackModal.feedback.comment}
                </p>
              </>
            )}

            <div className="flex justify-end mt-4">
              <Button
                variant="secondary"
                onClick={() => setViewFeedbackModal({ open: false })}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionDetail;
