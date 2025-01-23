"use client";
import React, { useState, useEffect, useRef } from "react";
import '@fortawesome/fontawesome-free/css/all.min.css';
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useLoading } from '../context/LoadingContext';
import { toast } from 'react-toastify';

export default function Chat() {
  const [messages, setMessages] = useState([]); // Safe default initialization
  const [progress, setProgress] = useState(0); // Ensure progress is always a number
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [timeLeft, setTimeLeft] = useState(1 * 60); // 40 minutes in seconds
  const router = useRouter();
  const { setLoading } = useLoading();
  const [hasSessionExpired, setHasSessionExpired] = useState(false);
  const [isConversationSaved, setIsConversationSaved] = useState(false);
  const saveFlag = useRef(false);
  

  // Fetch initial question and restore session
  const fetchInitialQuestion = async (user) => {
    try {
      setIsConversationSaved(false);
      const idToken = await user.getIdToken(true);
      const response = await fetch('http://127.0.0.1:5000/chat', {
        method: 'GET',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const data = await response.json();
      if (data.error) {
        toast.error("Error: " + data.error);
        return;
      }

      const conversationHistory = data.conversation_history || [];
      const progressValue = Number(data.progress) || 0;
      const nextQuestion = data.next_question || "No more questions.";

      if (conversationHistory.length > 0) {
        setMessages(conversationHistory);
        setProgress(progressValue);
        setCurrentQuestion(nextQuestion);
      } else {
        setMessages([{ role: 'assistant', content: `${data.message || ""}, ${nextQuestion}` }]);
        setProgress(progressValue);
        setCurrentQuestion(nextQuestion);
      }
    } catch (error) {
      toast.error("Failed to load the initial question. Please try again.");
    } 
  };

  // Handle session expiration logic
  const handleSessionExpiration = () => {
    if (hasSessionExpired || saveFlag.current) return; // Guard clause with useRef

    saveFlag.current = true; // Mark as saved
    setHasSessionExpired(true);

    alert("Your session has expired. Please start a new session.");

    setMessages((prevMessages) => {
      const updatedMessages = [
        ...prevMessages,
        { role: "assistant", content: "Session Expired" },
      ];

      // Save conversation history only once using saveFlag
      sendConversationHistory(updatedMessages);

      return updatedMessages;
    });
  };
  

  // Handle timer countdown
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchInitialQuestion(user);
      } else {
        router.push("/");
      }
    });

    const timer = setInterval(() => {
      
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSessionExpiration();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, [router, hasSessionExpired]);

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle sending user message
  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (hasSessionExpired || isConversationSaved) return;

    const messageInput = document.getElementById("text");
    const userMessage = messageInput.value.trim();
    if (!userMessage) return;

    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);

    try {
      const response = await fetch("http://127.0.0.1:5000/chat", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();
      if (data.error) {
        toast.error("Error: " + data.error);
        return;
      }

      setProgress(Number(data.progress) || 0);
      const assistantMessages = [
        ...newMessages,
        { role: "assistant", content: data.chatbot_response },
      ];

      if (data.next_question) {
        assistantMessages.push({ role: "assistant", content: data.next_question });
        setMessages(assistantMessages);
        setCurrentQuestion(data.next_question);
      } else {
        assistantMessages.push({ role: "assistant", content: data.final_message });
        setMessages(assistantMessages);

        if (!isConversationSaved) {
          setTimeout(() => {
            sendConversationHistory(assistantMessages);
            setIsConversationSaved(true);
          }, 1000);
        }
      }
    } catch (error) {
      toast.error("Error sending message. Please try again.");
    } 

    messageInput.value = "";
  };

  // Send conversation history to the server
  const sendConversationHistory = async (conversation) => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user || !conversation || conversation.length === 0) {
      toast.error("No conversation history to save.");
      return;
    }

    try {
      const idToken = await user.getIdToken(true);
      const response = await fetch('http://127.0.0.1:5000/save_conversation', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ conversationHistory: conversation }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Practice Session saved successfully!");
        router.push("/");
      } else {
        toast.error("Error saving conversation history.");
      }
    } catch (error) {
      toast.error("Error saving conversation history. Please try again.");
    } 
  };
  

  return (
    <div className="flex items-center justify-center mt-10 h-screen bg-transparent">
      <div className="bg-white shadow-lg rounded-lg w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="chat_container text-white py-4 px-6 flex items-center">
          <img
            src="https://img.favpng.com/16/0/10/chatbot-logo-robotics-png-favpng-9dXq9bg2WxSjeC6BvTCb6kxNC.jpg"
            alt="Chatbot"
            className="w-10 h-10 rounded-full"
          />
          <div className="ml-4">
            <h1 className="text-lg font-bold">Stitch</h1>
            <p className="text-sm">Interview Simulator</p>
          </div>
          <div className="ml-auto">
            <div className="bg-gray-700 px-3 py-1 rounded-full text-sm">
              Timer: <span id="timer">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-gray-50">
          <label
            htmlFor="progress-bar"
            className="block text-sm font-medium text-gray-600 mb-1"
          >
            Interview Progress
          </label>
          <div className="relative w-full bg-gray-200 rounded-full h-4">
            <div
              id="progress-bar"
              className="absolute top-0 left-0 progress h-4 rounded-full"
              style={{ width: `${progress || 0}%` }} // Default to 0 if NaN
            ></div>
            <span
              id="progress-percentage"
              className="absolute right-2 text-xs font-medium text-gray-600"
            >
              {progress || 0}% {/* Default to 0 if NaN */}
            </span>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-white">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'assistant' ? 'items-start' : 'items-end'} space-x-3`}
            >
              {msg.role === 'assistant' ? (
                <img
                  src="https://img.favpng.com/16/0/10/chatbot-logo-robotics-png-favpng-9dXq9bg2WxSjeC6BvTCb6kxNC.jpg"
                  alt="assistant"
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="flex-grow"></div>
              )}

              {/* Chat Bubble */}
              <div
                className={`max-w-[80%] p-3 text-sm text-gray-800 rounded-lg ${
                  msg.role === 'assistant'
                    ? 'bg-gray-100'
                    : 'bg-green-100 text-right'
                }`}
              >
                {msg.content || "No content"}
              </div>
            </div>
          ))}
        </div>

        {/* Input Field */}
        <form className="flex items-center space-x-2 m-3" onSubmit={handleSendMessage}>
          <input
            type="text"
            id="text"
            placeholder="Type your message here..."
            className="flex-grow px-3 py-2 form-control text-black border rounded"
          />
          <button
            type="submit"
            id="send"
            className="sendMsg-btn px-4 py-2"
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </form>
      </div>
    </div>
  );
}
