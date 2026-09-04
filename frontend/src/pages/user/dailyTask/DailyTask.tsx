import React, { useState, useRef, useEffect, Suspense, lazy } from "react";
import {
  BookOpen,
  Mic,
  Headphones,
  PenTool,
  X,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import {
  latestSubmission,
  topicGenerate,
  submitResponse,
} from "../../../services/dailyTaskService";

const DashboardHeader = lazy(() => import("../DashBoardComponents/Header"));
const Button = lazy(() => import("../../../modals/Button"));

interface TaskFeedback {
  strengths: string;
  weaknesses: string;
  feedback: string;
}

type TaskType = "writing" | "speaking" | "listening" | "reading";

interface Responses {
  writing: string;
  speaking: string | null;
  listening: Record<string, string>;
  reading: Record<string, string>;
}

interface TaskContent {
  prompt?: string;
  paragraph?: string;
  questions?: string[];
}

interface DailyTask {
  id: string;
  topic: string;
  writing: TaskContent;
  speaking: TaskContent;
  listening: TaskContent;
  reading: TaskContent;
  userResponses?: Responses;
  feedback?: Record<string, TaskFeedback>;
}

const DailyTaskPage = () => {
  const [selectedTopic, setSelectedTopic] = useState("");
  const [taskData, setTaskData] = useState<DailyTask | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<TaskType | null>(null);
  const [submittedTasks, setSubmittedTasks] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Record<string, TaskFeedback> | null>(
    null
  );

  const [feedbackModal, setFeedbackModal] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submitConfirmModal, setSubmitConfirmModal] = useState(false);
  const [warningModal, setWarningModal] = useState({
    open: false,
    message: "",
  });

  const [responses, setResponses] = useState<Responses>({
    writing: "",
    speaking: null,
    listening: {},
    reading: {},
  });

  const [recording, setRecording] = useState(false);
  const [_paused, setPaused] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [listeningSpeaking, setListeningSpeaking] =
    useState<SpeechSynthesisUtterance | null>(null);
  const [listeningPaused, setListeningPaused] = useState(false);

  const topics = [
    { id: "communication", label: "Communication", icon: "💬" },
    { id: "technology", label: "Technology", icon: "💻" },
    { id: "environment", label: "Environment", icon: "🌍" },
    { id: "education", label: "Education", icon: "📚" },
    { id: "health", label: "Health", icon: "🏥" },
    { id: "culture", label: "Culture", icon: "🎭" },
  ];

  const taskCards = [
    {
      id: "writing",
      title: "Writing Task",
      icon: PenTool,
      color: "from-green-500 to-emerald-500",
      description: "Express your thoughts in writing",
    },
    {
      id: "speaking",
      title: "Speaking Task",
      icon: Mic,
      color: "from-blue-500 to-cyan-500",
      description: "Practice your spoken communication",
    },
    {
      id: "listening",
      title: "Listening Task",
      icon: Headphones,
      color: "from-purple-500 to-pink-500",
      description: "Enhance your listening comprehension",
    },
    {
      id: "reading",
      title: "Reading Task",
      icon: BookOpen,
      color: "from-orange-500 to-red-500",
      description: "Improve your reading skills",
    },
  ] as const;

  useEffect(() => {
    const fetchExistingTask = async () => {
      setLoading(true);
      try {
        const response = await latestSubmission();
        const data = response.data;
        if (data.task) {
          setSelectedTopic(data.task.topic);
          setTaskData(data.task);
          setResponses(
            data.task.userResponses || {
              writing: "",
              speaking: null,
              listening: {},
              reading: {},
            }
          );
          setSubmittedTasks(taskCards.map((c) => c.id));

          const normalizedFeedback: Record<string, TaskFeedback> = {};

          for (const key of ["writing", "reading", "listening", "speaking"]) {
            const fb =
              data.task[key]?.feedback || data.task.feedback?.[key] || null;
            if (fb)
              normalizedFeedback[key] = fb.feedback
                ? fb
                : {
                    strengths: fb.strengths || "",
                    weaknesses: fb.weaknesses || "",
                    feedback: fb.feedback || fb || "",
                  };
          }

          setFeedback(
            Object.keys(normalizedFeedback).length ? normalizedFeedback : {}
          );
          setAlreadySubmitted(true);
        }
      } catch (err) {
        console.error("Failed to fetch existing task:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchExistingTask();
  }, []);

  const handleTopicSelect = async (topic: string) => {
    setSelectedTopic(topic);
    setLoading(true);
    try {
      const response = await topicGenerate(topic);
      const data = await response.data;
      setTaskData(data.task);
      const existingResponses = data.task.userResponses || {};
      setResponses({
        writing: existingResponses.writing || "",
        speaking: existingResponses.speaking || null,
        listening: existingResponses.listening || {},
        reading: existingResponses.reading || {},
      });
      if (data.task.feedback) {
        setFeedback(data.task.feedback);
        setAlreadySubmitted(true);
      }
    } catch (error) {
      console.error("Error fetching task:", error);
      alert("Failed to load tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (taskType: TaskType) => {
    setActiveModal(taskType);

    if (taskType === "speaking") {
      setAudioUrl(responses.speaking || null);
    } else {
      setAudioUrl(null); // all other tasks don't use audio
    }
  };

  const handleCloseModal = () => setActiveModal(null);

  const handleTaskComplete = () => {
    if (!activeModal) return;
    const response = responses[activeModal];

    let isValid = false;

    if (typeof response === "string") {
      isValid = response.trim() !== "";
    } else if (response && typeof response === "object") {
      isValid = Object.values(response).some(
        (val) => typeof val === "string" && val.trim() !== ""
      );
    }

    if (!isValid) {
      setWarningModal({
        open: true,
        message:
          "Please provide a response before marking the task as complete!",
      });
      return;
    }

    if (!submittedTasks.includes(activeModal)) {
      setSubmittedTasks((prev) => [...prev, activeModal]);
    }

    handleCloseModal();
  };

  const handleFinalSubmit = async () => {
    if (submittedTasks.length !== taskCards.length) {
      alert("Please complete all tasks before submitting!");
      return;
    }

    try {
      const response = await submitResponse(taskData!.id, responses);
      const data = await response.data;
      setFeedback(data.feedback);
      localStorage.setItem("dailyTaskSubmitted", new Date().toISOString());
      setAlreadySubmitted(true);
      setSubmitConfirmModal(true);
    } catch (err) {
      console.error(err);
      alert("Failed to submit. Try again.");
    }
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setResponses((prev) => ({ ...prev, speaking: url }));
    };

    mediaRecorder.start();
    setRecording(true);
    setPaused(false);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    setPaused(false);
  };

  const handlePlayAudio = () => {
    if (!taskData?.listening?.paragraph) return;

    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(
      taskData.listening.paragraph
    );
    utterance.lang = "en-US";

    utterance.onend = () => {
      setListeningSpeaking(null);
      setListeningPaused(false);
    };

    speechSynthesis.speak(utterance);
    setListeningSpeaking(utterance);
    setListeningPaused(false);
  };

  const stopListening = () => {
    speechSynthesis.cancel();
    setListeningSpeaking(null);
    setListeningPaused(false);
  };

  return (
    <Suspense fallback={<p>Loading Daily Task...</p>}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white py-24">
        <DashboardHeader />

        <div className="max-w-7xl mx-auto px-6 pt-6">
          {!selectedTopic && !alreadySubmitted && (
            <div className="mb-16">
              <h2 className="text-2xl font-semibold text-center mb-8 text-white">
                Choose Your Topic
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {topics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => handleTopicSelect(topic.id)}
                    className="group relative bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-green-500/20"
                  >
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                      {topic.icon}
                    </div>
                    <div className="text-sm font-semibold text-white">
                      {topic.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-500"></div>
              <p className="mt-4 text-xl text-gray-300">
                Loading your tasks...
              </p>
            </div>
          )}

          {selectedTopic && taskData && !loading && (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-emerald-400 capitalize">
                    {selectedTopic} Tasks
                  </h2>
                  <p className="text-gray-400 mt-1">
                    Complete all four tasks to master today’s challenge
                  </p>
                </div>
                {!alreadySubmitted && (
                  <Button
                    onClick={() => {
                      setSelectedTopic("");
                      setTaskData(null);
                      setSubmittedTasks([]);
                      setResponses({
                        writing: "",
                        speaking: null,
                        listening: {},
                        reading: {},
                      });
                    }}
                    className="px-6 py-3 bg-white/10 backdrop-blur-md border border-gray-700 rounded-xl hover:bg-white/20 transition-all"
                  >
                    Change Topic
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {taskCards.map((card) => {
                  const Icon = card.icon;
                  const isCompleted =
                    submittedTasks.includes(card.id) || alreadySubmitted;
                  return (
                    <div
                      key={card.id}
                      className="backdrop-blur-lg bg-white/10 border border-white/10 rounded-2xl p-8 hover:border-green-500/40 shadow-lg transition-all duration-300 hover:shadow-emerald-500/10 hover:scale-[1.02]"
                    >
                      <div
                        className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${card.color} mb-4`}
                      >
                        <Icon size={32} className="text-white" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">{card.title}</h3>
                      <p className="text-gray-300 mb-6">{card.description}</p>
                      {!alreadySubmitted && (
                        <Button
                          onClick={() => handleOpenModal(card.id)}
                          disabled={isCompleted}
                          className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                            isCompleted
                              ? "bg-green-500/50 cursor-not-allowed"
                              : `bg-gradient-to-r ${card.color} hover:shadow-lg hover:scale-105`
                          }`}
                        >
                          {isCompleted ? "Completed ✓" : "Start Task"}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>

              {alreadySubmitted && (
                <div className="mt-10 text-center">
                  <Button
                    onClick={() => setFeedbackModal(true)}
                    className="px-8 py-4 text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl hover:scale-105 transition-all"
                  >
                    View Answers & Feedback 📝
                  </Button>
                </div>
              )}

              {!alreadySubmitted &&
                submittedTasks.length === taskCards.length && (
                  <div className="mt-10 text-center">
                    <Button
                      onClick={handleFinalSubmit}
                      className="px-8 py-4 text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl hover:scale-105 transition-all"
                    >
                      Submit All Tasks 🚀
                    </Button>
                  </div>
                )}
            </>
          )}

          {/* Task Modal */}
          {activeModal && taskData && !alreadySubmitted && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-white/20">
                <div
                  className={`bg-gradient-to-r ${
                    taskCards.find((t) => t.id === activeModal)?.color
                  } p-6 flex items-center justify-between`}
                >
                  <div className="flex items-center gap-3">
                    {React.createElement(
                      taskCards.find((t) => t.id === activeModal)?.icon ||
                        PenTool,
                      { size: 28 }
                    )}
                    <h3 className="text-2xl font-bold capitalize">
                      {activeModal} Task
                    </h3>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 hover:bg-white/20 rounded-full transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                  <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10">
                    <h4 className="text-lg font-semibold mb-3 text-emerald-400">
                      Task Instructions
                    </h4>
                    <div className="text-gray-300 whitespace-pre-wrap">
                      {taskData[activeModal]?.prompt || "No prompt available"}
                    </div>
                  </div>

                  {activeModal === "writing" && (
                    <textarea
                      value={responses.writing}
                      onChange={(e) =>
                        setResponses((prev) => ({
                          ...prev,
                          writing: e.target.value,
                        }))
                      }
                      className="w-full h-64 px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Type your response..."
                    />
                  )}

                  {activeModal === "speaking" && (
                    <div className="space-y-4">
                      {!recording ? (
                        <Button
                          onClick={startRecording}
                          className="bg-blue-600 w-full py-3 px-6 rounded-xl"
                        >
                          🎤 Start Recording
                        </Button>
                      ) : (
                        <Button
                          onClick={stopRecording}
                          className="bg-red-600 w-full py-3 px-6 rounded-xl"
                        >
                          ⏹ Stop Recording
                        </Button>
                      )}

                      {audioUrl && (
                        <audio controls src={audioUrl} className="w-full" />
                      )}
                    </div>
                  )}

                  {activeModal === "listening" && (
                    <div className="space-y-4">
                      <div className="flex gap-3 mb-4">
                        <Button
                          className="bg-purple-600 flex-1 py-3 px-6 rounded-xl"
                          onClick={handlePlayAudio}
                          disabled={!!listeningSpeaking && !listeningPaused}
                        >
                          🎧 {listeningSpeaking ? "Restart" : "Play Audio"}
                        </Button>

                        <Button
                          className="bg-red-600 flex-1 py-3 px-6 rounded-xl"
                          onClick={stopListening}
                          disabled={!listeningSpeaking}
                        >
                          ⏹ Stop
                        </Button>
                      </div>

                      {taskData.listening?.questions?.map((q, i) => (
                        <div key={i} className="mb-4">
                          <p className="text-gray-300 mb-2">{q}</p>
                          <textarea
                            value={responses.listening?.[i] || ""}
                            onChange={(e) =>
                              setResponses((prev) => ({
                                ...prev,
                                listening: {
                                  ...prev.listening,
                                  [i]: e.target.value,
                                },
                              }))
                            }
                            className="w-full h-20 px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {activeModal === "reading" && (
                    <div>
                      <div className="text-gray-300 mb-4">
                        <h4 className="font-semibold mb-2">Paragraph</h4>
                        <p>{taskData.reading.paragraph}</p>
                      </div>

                      {taskData.reading?.questions?.map((q, i) => (
                        <div key={i} className="mb-4">
                          <p className="text-gray-300 mb-2">{q}</p>
                          <textarea
                            value={responses.reading?.[i] || ""}
                            onChange={(e) =>
                              setResponses((prev) => ({
                                ...prev,
                                reading: {
                                  ...prev.reading,
                                  [i]: e.target.value,
                                },
                              }))
                            }
                            className="w-full h-20 px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-white/10 flex gap-3">
                  <Button
                    onClick={handleCloseModal}
                    className="flex-1 bg-white/10 py-3 px-6 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleTaskComplete}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 py-3 px-6 rounded-xl"
                  >
                    Mark as Complete ✓
                  </Button>
                </div>
              </div>
            </div>
          )}

          {warningModal.open && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full border border-white/20 p-6">
                <div className="flex flex-col items-center text-center">
                  <AlertTriangle size={48} className="text-yellow-400 mb-4" />

                  <h3 className="text-xl font-bold text-yellow-400 mb-2">
                    Warning
                  </h3>

                  <p className="text-gray-300 mb-6">{warningModal.message}</p>

                  <Button
                    onClick={() =>
                      setWarningModal({ open: false, message: "" })
                    }
                    className="bg-gradient-to-r from-yellow-500 to-amber-600 w-full py-3 rounded-xl"
                  >
                    Okay
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Modal */}
          {feedbackModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-white/20">
                <div className="flex justify-between items-center p-6 border-b border-white/10">
                  <h3 className="text-2xl font-bold text-green-400">
                    AI Feedback & Your Answers
                  </h3>
                  <button
                    onClick={() => setFeedbackModal(false)}
                    className="p-2 hover:bg-white/20 rounded-full transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
                  {feedback && Object.keys(feedback).length > 0 ? (
                    Object.keys(feedback).map((taskKey) => {
                      const taskFeedback = feedback[taskKey];
                      return (
                        <div
                          key={taskKey}
                          className="bg-white/5 p-4 rounded-xl border border-white/10"
                        >
                          <h4 className="text-xl font-semibold capitalize mb-3 text-emerald-400">
                            {taskKey} Feedback
                          </h4>
                          <p className="text-green-400 font-semibold mb-1">
                            Strengths
                          </p>
                          <p className="text-gray-300 mb-3 whitespace-pre-wrap">
                            {taskFeedback.strengths || "N/A"}
                          </p>
                          <p className="text-red-400 font-semibold mb-1">
                            Weaknesses
                          </p>
                          <p className="text-gray-300 mb-3 whitespace-pre-wrap">
                            {taskFeedback.weaknesses || "N/A"}
                          </p>
                          <p className="text-blue-400 font-semibold mb-1">
                            💡 Feedback
                          </p>
                          <p className="text-gray-300 whitespace-pre-wrap">
                            {taskFeedback.feedback || "No feedback provided."}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-400 text-center">
                      No feedback available yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submit Confirmation Modal */}
          {submitConfirmModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-white/20 p-6">
                <div className="flex flex-col items-center text-center">
                  <Sparkles size={48} className="text-green-400 mb-4" />

                  <h3 className="text-2xl font-bold text-green-400 mb-2">
                    Submission Successful! 🎉
                  </h3>

                  <p className="text-gray-300 mb-6">
                    Your responses have been submitted. You can now view your
                    answers and AI feedback.
                  </p>

                  <div className="flex gap-3 w-full">
                    <Button
                      onClick={() => setSubmitConfirmModal(false)}
                      className="flex-1 bg-white/10 py-3 rounded-xl"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Suspense>
  );
};

export default DailyTaskPage;
