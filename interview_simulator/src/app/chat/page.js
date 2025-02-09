"use client";
import React, { useState, useEffect, useRef } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useLoading } from "../context/LoadingContext";
import { toast } from "react-toastify";

export default function Chat() {
  const [messages, setMessages] = useState([]); // Safe default initialization
  const [progress, setProgress] = useState(0); // Ensure progress is always a number
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [timeLeft, setTimeLeft] = useState(40 * 60); // 40 minutes in seconds
  const router = useRouter();
  const { setLoading } = useLoading();
  const [hasSessionExpired, setHasSessionExpired] = useState(false);
  const [isConversationSaved, setIsConversationSaved] = useState(false);
  const saveFlag = useRef(false);
  const [timerStyle, setTimerStyle] = useState({});
  const isMounted = useRef(true); // Track if the component is still mounted
  const chatEndRef = useRef(null); // Reference to the bottom of the chat
  const [isTyping, setIsTyping] = useState(false);

  // Function to handle session expiration
  const fetchInitialQuestion = async (user) => {
    try {
      setIsConversationSaved(false);
      const idToken = await user.getIdToken(true);
      const response = await fetch("http://127.0.0.1:5000/chat", {
        method: "GET",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      const data = await response.json();
      if (data.error) {
        toast.error("Error: " + data.error);
        return;
      }
      console.log(data);
      const conversationHistory = data.conversation_history || [];
      const progressValue = Number(data.progress) || 0;
      const nextQuestion = data.next_question || "No more questions.";
      const remainingTime = Math.ceil(Number(data.remaining_time || 60)); // Ensure the time is in seconds
      if (isMounted.current) {
        // Ensure the component is still mounted before updating state
        if (conversationHistory.length > 0) {
          setMessages(conversationHistory);
          setProgress(progressValue);
          setCurrentQuestion(nextQuestion);
        } else {
          setMessages([
            {
              role: "assistant",
              content: `${data.message || ""}, ${nextQuestion}`,
            },
          ]);
          setProgress(progressValue);
          setCurrentQuestion(nextQuestion);
        }
        setTimeLeft(remainingTime); // Update the timer
      }
    } catch (error) {
      toast.error("Failed to load the initial question. Please try again.");
    }
  };

  // Function to handle session expiration
  const handleSessionExpiration = () => {
    if (hasSessionExpired || saveFlag.current) return;
    saveFlag.current = true;
    setMessages((prevMessages) => {
      const updatedMessages = [
        ...prevMessages,
        { role: "system", content: "Session Expired" },
      ];
      return updatedMessages;
    });
    setHasSessionExpired(true); // Flag the session as expired
    isMounted.current = false;
    // Handle session expiration
    setTimeout(() => {
      toast.info("Your session has expired. Please try again.");
      router.push("/"); // Redirect to home page
    }, 1000);
  };

  // Session expiration logic
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchInitialQuestion(user); // Fetch initial question as soon as user is authenticated
      } else {
        router.push("/");
      }
    });
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSessionExpiration(); // Handle session expiration when time runs out
          return 0;
        }
        // Check if the time left is less than or equal to 2 minutes (120 seconds)
        if (prev <= 120 && timeLeft > 0) {
          setTimerStyle("gradient-text");
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, [router, hasSessionExpired, timerStyle]);
  // Manage session expiration and loading state
  useEffect(() => {
    if (hasSessionExpired) {
      setLoading(false); // Set loading false when session expires
    }
  }, [hasSessionExpired, setLoading]);

  // Handle sending the conversation history (with loading state handling)
  useEffect(() => {
    if (hasSessionExpired && !isConversationSaved) {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user && messages.length > 0) {
        sendConversationHistory(messages); // Save conversation when session expires
        setIsConversationSaved(true); // Flag that conversation has been saved
      }
    }
  }, [hasSessionExpired, messages, isConversationSaved]);

  // Scroll to the bottom whenever messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const sendConversationHistory = async (conversation) => {
    const auth = getAuth();
    const user = auth.currentUser;
    console.log("CONVERSATION: ", conversation);
    if (!user || !conversation || conversation.length === 0) {
      toast.error("No conversation history to save.");
      return;
    }
    setLoading(true);
    try {
      const idToken = await user.getIdToken(true);
      const response = await fetch("http://127.0.0.1:5000/save_conversation", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ conversationHistory: conversation }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Practice Session saved successfully!");
        router.push("/"); // Navigate after success
      } else {
        toast.error("Error saving conversation history.");
      }
    } catch (error) {
      toast.error("Error saving conversation history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };
  const handleSendMessage = async (event) => {
    if (hasSessionExpired || isConversationSaved) return;

    const userMessage = document.getElementById("text").value.trim();
    if (!userMessage) return;

    // Optimized state update for messages
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "user", content: userMessage },
    ]);

    try {
      const response = await fetch("http://127.0.0.1:5000/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();
      if (data.error) {
        toast.error("Error: " + data.error);
        return;
      }

      setIsTyping(true);
      setProgress(data.progress ? Number(data.progress) : 0);
      setTimeLeft(timeLeft);

      console.log("Response: ", data);

      const assistantResponse = {
        role: "assistant",
        content: data.chatbot_response,
      };

      setMessages((prevMessages) => [...prevMessages, assistantResponse]);

      if (data.next_question) {
        setTimeout(() => {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              role: "assistant",
              category: data.next_question_category || "No category provided",
              content: data.next_question,
            },
          ]);
          setCurrentQuestion(data.next_question);
          setIsTyping(false);
        }, 2000);
      } else {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: "assistant",
            content: data.final_message,
          },
        ]);
        setTimeout(() => {
          setIsTyping(false);
          // Save conversation history asynchronously after message update
          sendConversationHistory([...messages, assistantResponse]);
        }, 2000);
      }
    } catch (error) {
      toast.error("Error sending message. Please try again.");
      setIsTyping(false);
    }

    document.getElementById("text").value = ""; // Clear input
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevents creating a new line in the textarea
      handleSendMessage();
    }
  };

  return (
    <div className="flex items-center justify-center mt-14 h-screen w-full ">
      <div className="flex flex-col sm:flex-row w-full h-full shadow-lg  overflow-hidden">
        {/* Booklet Section */}
        <div className="w-full sm:w-1/3 booklet_background text-white p-6 flex flex-col justify-between mb-6 sm:mb-0">
          <h2 className="text-2xl font-bold mb-4">STAR Method</h2>
          <p className="text-sm leading-6 mb-4">
            <strong>S - Situation:</strong> Describe the context or background
            of the task.
            <br />
            <strong>T - Task:</strong> Explain the challenge or responsibility
            you faced.
            <br />
            <strong>A - Action:</strong> Detail the specific steps you took.
            <br />
            <strong>R - Result:</strong> Share the outcome of your actions.
          </p>
          <p className="text-sm">
            Use this structured approach to provide clear, concise, and
            impactful answers during the interview.
          </p>
        </div>
        {/* Chat Section */}
        <div className="w-full sm:w-2/3 flex flex-col bg-transparent h-full">
          {/* Chat Header */}
          <div className="chat_container text-white py-4 px-6 flex items-center">
            <img
              src="/logo.png"
              alt="Chatbot"
              className="w-10 h-10 rounded-full"
            />
            <div className="ml-4">
              <p className="text-md font-medium">Interview Simulator</p>
            </div>
            <div className="ml-auto">
              <div
                className={`chat_timer px-3 py-1 ${
                  timeLeft <= 120 && timeLeft > 0 ? "gradient-text" : ""
                }`}
              >
                Timer: <span id="timer">{formatTime(timeLeft)}</span>
              </div>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="px-3 py-3">
            <label
              htmlFor="progress-bar"
              className="block text-sm progress_header mb-2"
            >
              Session Progress
            </label>
            <div className="relative w-full progress-bar shadow-md overflow-hidden">
              <div
                id="progress-bar"
                className="absolute top-0 left-0 h-full rounded-full progress"
                style={{
                  width: `${progress || 0}%`,
                }}
              >
                <span className="text-xs font-bold ml-2 text-white">
                  {progress || 0}%
                </span>
              </div>
            </div>
          </div>
          {/* Chat Area */}
          <div className="flex-grow chat-area overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.role === "assistant" ? "justify-start" : "justify-end"
                } space-x-3`}
              >
                {msg.role === "assistant" ? (
                  <>
                    <img
                      src="/logo.png"
                      alt="assistant"
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="max-w-[80%] p-3 text-sm message chat-bubble-assistant">
                      {msg.content || "No content"}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-end">
                    <div className="max-w-[80%] p-3 text-sm message chat-bubble-user">
                      {msg.content || "No content"}
                    </div>
                    <span className="text-sm text-gray-500 mt-1">You</span>
                  </div>
                )}
              </div>
            ))}
            {/* Dummy element to track the bottom */}
            <div ref={chatEndRef} />
          </div>
          {/* Chatbot typing indicator */}
          {isTyping && (
            <div className="flex justify-start ml-2 space-x-3">
              <img
                src="/logo.png"
                alt="assistant"
                className="w-8 h-8 rounded-full"
              />
              <div className="max-w-[80%] p-3 text-sm message bg-white shadow-md rounded-lg ">
                <div className="typing-dots">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </div>
              </div>
            </div>
          )}
          {/* Input Field */}
          <form
            className="flex items-end space-x-2 m-3"
            onSubmit={handleSendMessage}
          >
            <textarea
              id="text"
              placeholder="Type your answer here..."
              className="flex-grow px-3 py-2 form-control-chat border resize-none chat-area overflow-y-auto"
              rows="1"
              style={{
                minHeight: "40px",
                maxHeight: "80px",
                height: "auto",
              }}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={handleKeyDown}
            />
            <button
              type="button"
              id="send"
              className="sendMsg-btn px-4 py-2 flex-shrink-0"
              style={{
                height: "100%",
              }}
              onClick={(e) => {
                e.preventDefault(); // Ensure no page refresh on button click
                handleSendMessage(e);
              }}
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
