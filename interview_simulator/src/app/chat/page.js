"use client";
import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useLoading } from "../context/LoadingContext";
import { toast } from "react-toastify";
import ChatTour from "../components/chatTour";
import SessionEndModal from "../components/SessionEndModal";
import SessionExpiredModal from "../components/SessionExpiredModal";
import Image from "next/image";
import { useAuth } from "../context/AuthContext";

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
  const [questionFetched, setQuestionFetched] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const textareaRef = useRef(null);
  const [tourCompleted, setTourCompleted] = useState(false);
  const [sessionEndModal, setSessionEndModal] = useState(false);
  const [sessionExpiredModal, setSessionExpiredModal] = useState(false);
  const timerRef = useRef(null);
  const [inputValue, setInputValue] = useState("");
  const [showError, setShowError] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user]);

  useEffect(() => {
    const checkTourCompletion = () => {
      if (typeof window !== "undefined") {
        const completed = localStorage.getItem("chatTourCompleted");
        setTourCompleted(completed === "true");
      }
    };

    checkTourCompletion();
  }, [tourCompleted]);

  useEffect(() => {
    if (!isDisabled) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isDisabled]);

  // Function to fetch initial questions
  const fetchInitialQuestion = async (user) => {
    if (user) {
      try {
        setIsConversationSaved(false);
        const idToken = await user.getIdToken(true);
        const response = await fetch(
          "https://interview-simulator-iy3l.onrender.com/chat",
          {
            method: "GET",
            credentials: "include",
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          }
        );

        const data = await response.json();

        if (data.error) {
          toast.error("Error: " + data.error);
          return;
        }

        console.log("Data: ", data);

        const conversationHistory = data?.conversation_history || [];
        const progressValue = Number(data?.progress) || 0;
        const initialQuestion = data?.initial_question;
        const remainingTime = Math.ceil(Number(data?.remaining_time || 60));

        if (isMounted.current) {
          setMessages(() => {
            let fullHistory = [...conversationHistory];

            // If there's no history, add the initial question
            if (fullHistory.length === 0 && initialQuestion) {
              fullHistory.push({ role: "assistant", content: initialQuestion });
            }

            return fullHistory;
          });

          setProgress(progressValue);
          setTimeLeft(remainingTime);
        }
      } catch (error) {
        toast.error("Failed to load the initial question. Please try again.");
      }
    } else return;
  };

  // Function to handle session expiration (triggered only when the timer runs out)
  const handleSessionExpiration = async () => {
    if (
      hasSessionExpired ||
      saveFlag.current ||
      isConversationSaved ||
      !isMounted.current
    )
      return; // Prevent duplicate saves

    saveFlag.current = true; // Prevent further saves

    setMessages((prevMessages) => {
      const updatedMessages = [
        ...prevMessages,
        { role: "assistant", content: "Session Expired" },
      ];

      // Call sendConversationHistory with updated messages
      sendConversationHistory(updatedMessages);
      setSessionExpiredModal(true);
      return updatedMessages; // Ensure state gets updated
    });

    setHasSessionExpired(true);
    isMounted.current = false;
  };

  // Fetch initial question after tour completion
  useEffect(() => {
    if (!tourCompleted) return;

    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !questionFetched) {
        fetchInitialQuestion(user).then(() => setQuestionFetched(true));
      } else if (!user) {
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, [router, questionFetched, tourCompleted]);

  // Handle session expiration
  useEffect(() => {
    if (!tourCompleted) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current); //timer
          handleSessionExpiration();
          return 0;
        }
        if (prev <= 120) setTimerStyle("gradient-text");
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timerStyle, tourCompleted]);

  // Manage session expiration and loading state
  useLayoutEffect(() => {
    if (hasSessionExpired) {
      setLoading(false);
    }
  }, [hasSessionExpired, setLoading]);

  // Scroll to the bottom whenever messages change
  useEffect(() => {
    const timeout = setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
    return () => clearTimeout(timeout);
  }, [messages, isTyping]);

  const sendConversationHistory = async (conversation) => {
    setIsDisabled(true);
    clearInterval(timerRef.current);
    localStorage.removeItem("chatTourCompleted");
    const auth = getAuth();
    const user = auth.currentUser;
    console.log("CONVERSATION: ", conversation);
    if (!user || !conversation || conversation.length === 0) {
      toast.error("No conversation history to save.");
      return;
    }
    if (!isConversationSaved) {
      try {
        const idToken = await user.getIdToken(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const response = await fetch(
          "https://interview-simulator-iy3l.onrender.com/save_conversation",
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ conversationHistory: conversation }),
          }
        );
        const data = await response.json();
        if (data.success) {
          setIsConversationSaved(true);
        } else {
          toast.error("Error saving conversation history.");
        }
      } catch (error) {
        toast.error("Error saving conversation history. Please try again.");
      }
    }
  };

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleSendMessage = async () => {
    if (hasSessionExpired || isConversationSaved || saveFlag.current) return;
    if (inputValue.trim().length < 40) return;

    const userMessage = document.getElementById("text").value.trim();
    if (!userMessage) return;

    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "user", content: userMessage },
    ]);
    setInputValue("");
    setIsDisabled(true);

    try {
      const response = await fetch(
        "https://interview-simulator-iy3l.onrender.com/chat",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMessage }),
        }
      );

      const data = await response.json();
      if (data.error) {
        toast.error("Error: " + data.error);
        return;
      }

      setIsTyping(true);
      setProgress(data.progress ? Number(data.progress) : 0);

      console.log("Response: ", data);

      // Prepare responses
      const assistantResponse = {
        role: "assistant",
        content: data.chatbot_response,
      };
      const nextQuestion = data.next_question
        ? {
            role: "assistant",
            category: data.next_question_category || "No category provided",
            content: data.next_question,
          }
        : null;

      setTimeout(() => {
        setMessages((prevMessages) => {
          let updatedMessages = [...prevMessages, assistantResponse];
          if (nextQuestion) {
            updatedMessages.push(nextQuestion);
            setCurrentQuestion(data.next_question);
            setIsDisabled(false);
          } else {
            updatedMessages.push({
              role: "assistant",
              content: data.final_message,
            });
            // Delay saving the conversation to allow user to read the final message
            setTimeout(() => {
              // Ensure conversation is saved only once
              if (!isConversationSaved && !saveFlag.current) {
                saveFlag.current = true; // Prevent future saves
                sendConversationHistory(updatedMessages);
                setSessionEndModal(true);
              }
            }, 4000);
          }
          return updatedMessages;
        });
        setIsTyping(false);
      }, 2000);
    } catch (error) {
      toast.error("Error sending message. Please try again.");
      setIsTyping(false);
    }

    document.getElementById("text").value = ""; // Clear input
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputValue.trim().length >= 40) handleSendMessage(e);
    }
  };
  // Check character count in real-time
  useEffect(() => {
    setShowError(inputValue.trim().length > 0 && inputValue.trim().length < 40);
  }, [inputValue]);

  return (
    <>
      <>
        {!tourCompleted && (
          <ChatTour
            onComplete={() => {
              window.location.reload();
              setTourCompleted(true);
            }}
          />
        )}
      </>
      <div className="flex items-center justify-center mt-2 min-h-screen h-screen w-full">
        <div className="flex flex-col sm:flex-row w-full min-h-screen h-full shadow-lg  overflow-hidden">
          {/* Booklet Section */}
          <div className="w-full sm:w-1/4 booklet_background text-white p-6 flex flex-col justify-between sm:mb-0">
            <button
              onClick={() => router.push("/")}
              className="flex items-left text-[#6D81F2] hover:text-[#F25E86]"
            >
              <i className="fas fa-arrow-left w-8 l-8 transition duration-300 hover:scale-110"></i>
            </button>
            <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#F25E86] to-[#6D81F2] mb-4">
              STAR Method
            </h2>

            {/* Centered & Smaller Image */}
            <div className="flex justify-center items-center">
              <Image
                src="/learning.png"
                width={200}
                height={200}
                alt="Feedback"
                className="w-3/4 sm:w-2/3 h-auto object-contain image-hover"
              />
            </div>

            <p id="answer_method" className="text-sm leading-6 mb-4">
              <strong>
                <span className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#F25E86] to-[#6D81F2]">
                  S
                </span>
                - Situation:
              </strong>{" "}
              Describe the context of the task.
              <br />
              <strong>
                <span className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#F25E86] to-[#6D81F2]">
                  T
                </span>
                - Task:
              </strong>{" "}
              Explain the challenge you faced.
              <br />
              <strong>
                <span className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#F25E86] to-[#6D81F2]">
                  A
                </span>
                - Action:
              </strong>{" "}
              Detail the specific steps you took.
              <br />
              <strong>
                <span className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#F25E86] to-[#6D81F2]">
                  R
                </span>
                - Result:
              </strong>{" "}
              Share the outcome of your actions.
            </p>

            {/* Divider after R */}
            <hr className="border-t border-gray-400 my-4" />

            <p id="notice" className="text-sm">
              Use this structured approach to provide clear, concise, and
              impactful answers during the interview.
            </p>
          </div>

          {/* Chat Section */}
          <div className="w-full sm:w-3/4 flex flex-col min-h-screen h-full">
            {/* Chat Header */}
            <div className="chat_container text-white py-4 px-6 flex items-center">
              <Image
                src="/logo.png"
                width={32}
                height={32}
                alt="Chatbot"
                className="w-10 h-10 rounded-full"
              />
              <div className="ml-4">
                <p className="text-md font-medium">Interview Simulator</p>
              </div>
              <div className="ml-auto">
                <div
                  id="timer"
                  className={`chat_timer px-3 py-1 ${
                    timeLeft <= 120 && timeLeft > 0 ? "gradient-text" : ""
                  }`}
                >
                  Timer: <span id="timer">{formatTime(timeLeft)}</span>
                </div>
              </div>
            </div>
            {/* Progress Bar */}
            <div
              className="px-3 py-3 border-b-2"
              style={{ borderBottomColor: "#2A2A40" }}
            >
              <label
                htmlFor="progress-bar"
                className="block text-sm progress_header mb-2"
              >
                Progress
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
                      <Image
                        src="/logo.png"
                        width={32}
                        height={32}
                        alt="assistant"
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="flex flex-col bg-[#F25E86] p-3 rounded-lg min-w-min max-w-2xl">
                        <div className="text-sm message text-white">
                          {msg.content || "No content"}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div>
                      <div className="flex flex-col bg-[#6D81F2] p-3 rounded-lg min-w-min max-w-2xl">
                        <div className="text-sm message text-white">
                          {msg.content || "No content"}
                        </div>
                      </div>
                      <span className="flex flex-row-reverse text-sm w-full text-right text-gray-500 mt-1">
                        You
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {/* Dummy element to track the bottom */}
              <div id="chatEnd" ref={chatEndRef} />
            </div>
            {/* Chatbot typing indicator */}
            {isTyping && (
              <div className="flex justify-start ml-3 space-x-3">
                <Image
                  src="/logo.png"
                  width={32}
                  height={32}
                  alt="assistant"
                  className="rounded-full"
                />
                <div className="max-w-[80%] p-3 text-sm message bg-[#2A2A40] shadow-md rounded-lg ">
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
              className="flex flex-col space-y-1 m-3"
              onSubmit={handleSendMessage}
            >
              {/* Wrapper for the textarea and error */}
              <div className="relative">
                {/* Error message with same width as textarea */}
                {showError && (
                  <div className="text-white bg-[#2A2A40] rounded text-xs px-2 py-1 mb-2 w-full">
                    Your response should be at least 40 characters long
                  </div>
                )}

                {/* Textarea and button aligned horizontally */}
                <div className="flex items-end space-x-2">
                  <textarea
                    ref={textareaRef}
                    id="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your answer here..."
                    className={`flex-grow px-3 py-2 form-control-chat border resize-none chat-area overflow-y-auto ${
                      isDisabled ? "disabled" : "focused"
                    }`}
                    rows="1"
                    disabled={isDisabled}
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
                    //onCopy={(e) => e.preventDefault()}
                    //onCut={(e) => e.preventDefault()}
                    //onPaste={(e) => e.preventDefault()}
                  />

                  <button
                    type="button"
                    id="send"
                    disabled={inputValue.trim().length < 40}
                    className={`sendMsg-btn px-4 py-2 flex-shrink-0 ${
                      inputValue.trim().length >= 40
                        ? "sendMsg-btn"
                        : "cursor-not-allowed"
                    }`}
                    style={{ height: "100%" }}
                    onClick={(e) => {
                      e.preventDefault(); // Prevent page refresh
                      handleSendMessage(e);
                    }}
                  >
                    <i className="fas fa-paper-plane"></i>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
        <SessionEndModal
          isOpen={sessionEndModal}
          conversationSaved={isConversationSaved}
          onClose={() => setSessionEndModal(false)}
        />
        <SessionExpiredModal
          isOpen={sessionExpiredModal}
          conversationSaved={isConversationSaved}
          onClose={() => setSessionExpiredModal(false)}
        />
      </div>
    </>
  );
}
