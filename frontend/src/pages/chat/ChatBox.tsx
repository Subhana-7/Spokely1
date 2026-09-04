import { useEffect, useState, useRef } from "react";
import { getMessages } from "../../services/chatService";
import { useAuthStore } from "../../store/userAuthStore";
import { Send, TypeIcon } from "lucide-react";
import { Socket } from "socket.io-client";

interface Message {
  id: string;
  sender: { id: string; name?: string; profilePicture?: string; role?: string };
  text: string;
  createdAt: string;
}

interface ChatBoxProps {
  socket: Socket;
  chatId: string;
  chatRole: string;
  chatName: string;
  profilePicture?: string;
}

export default function ChatBox({
  socket,
  chatId,
  chatRole,
  chatName,
  profilePicture,
}: ChatBoxProps) {
  const currentUser = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatIdRef = useRef(chatId);

  useEffect(() => {
    chatIdRef.current = chatId;
  }, [chatId]);

  useEffect(() => {
    if (!chatId || !currentUser) return;

    let isMounted = true;

    setMessages([]);

    socket.emit("join-room", chatId);

    const loadMessages = async () => {
      try {
        const res = await getMessages(chatId);
        if (!isMounted) return;

        const msgs = (res.data?.messages ?? []).map((m: any) => ({
          id: m.id || m._id,
          sender: typeof m.sender === "object" ? m.sender : { id: m.sender },
          text: m.text,
          createdAt: m.createdAt,
        }));

        setMessages(msgs);
      } catch (error) {
        console.error("Failed to load messages:", error);
      }
    };

    loadMessages();

    socket.emit("mark-read", { sessionId: chatId, userId: currentUser.id });

    const handleIncoming = (msg: any) => {

      if (msg.sessionId !== chatIdRef.current) {
        return;
      }

      const newMessage = {
        id: msg.id || msg._id || `${Date.now()}-${Math.random()}`,
        sender:
          typeof msg.sender === "object" ? msg.sender : { id: msg.sender },
        text: msg.text,
        createdAt: msg.createdAt,
      };

      setMessages((prev) => {
        if (prev.some((m) => m.id === newMessage.id)) {
          return prev;
        }

        const isDuplicate = prev.some(
          (m) =>
            m.text === newMessage.text &&
            m.sender.id === newMessage.sender.id &&
            Math.abs(
              new Date(m.createdAt).getTime() -
                new Date(newMessage.createdAt).getTime()
            ) < 1000
        );

        if (isDuplicate) {
          return prev;
        }

        return [...prev, newMessage];
      });
    };

    socket.on("chat-message", handleIncoming);

    return () => {
      isMounted = false;
      socket.off("chat-message", handleIncoming);
      socket.emit("leave-room", chatId);
    };
  }, [chatId, currentUser, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !currentUser) return;

    const messageText = input.trim();
    setInput("");

    socket.emit("chat-message", {
      sessionId: chatId,
      sender: {
        id: currentUser.id,
        name: currentUser.name,
        profilePicture: currentUser.profilePicture,
        role: currentUser.role,
      },
      text: messageText,
    });
  };

  return (
    <div
      className={`h-full flex flex-col bg-slate-800 text-white ${
        currentUser?.role === "user" ? "pt-18" : ""
      } `}
    >
      {/* Header */}
      <div className="bg-slate-900 px-6 py-4 border-b border-slate-600 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full overflow-hidden">
            {profilePicture ? (
              <img
                src={profilePicture}
                alt={chatName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="bg-emerald-500 w-full h-full flex items-center justify-center text-lg font-semibold">
                {chatName.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <h2 className="font-semibold">{chatName}</h2>
            <p className="text-sm text-gray-400 capitalize">{chatRole}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => {
          const isCurrentUser = m.sender.id === currentUser?.id;
          return (
            <div
              key={m.id}
              className={`flex ${
                isCurrentUser ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg shadow-sm ${
                  isCurrentUser
                    ? "bg-emerald-500 text-white rounded-br-none"
                    : "bg-slate-700 text-gray-300 rounded-bl-none border border-slate-600"
                }`}
              >
                <p className="text-sm leading-relaxed">{m.text}</p>
                <div
                  className={`text-xs mt-1 ${
                    isCurrentUser ? "text-emerald-200" : "text-gray-400"
                  }`}
                >
                  {new Date(m.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-slate-900 px-4 py-3 border-t border-slate-600">
        <div className="flex items-center space-x-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message"
            className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-400 text-white placeholder-gray-400"
          />
          {input.trim() ? (
            <button
              onClick={sendMessage}
              className="p-2 bg-emerald-500 hover:bg-emerald-600 rounded-full transition-colors"
            >
              <Send size={20} className="text-white" />
            </button>
          ) : (
            <button className="p-2 hover:bg-slate-700 rounded-full">
              <TypeIcon size={24} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
