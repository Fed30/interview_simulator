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
  const [timerStyle, setTimerStyle] = useState({});
  const isMounted = useRef(true); // Track if the component is still mounted
  
  // Function to handle session expiration
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
        const remainingTime = Math.ceil(Number(data.remaining_time || 60)); // Ensure the time is in seconds
  
        if (isMounted.current) { // Ensure the component is still mounted before updating state
          if (conversationHistory.length > 0) {
            setMessages(conversationHistory);
            setProgress(progressValue);
            setCurrentQuestion(nextQuestion);
          } else {
            setMessages([{ role: 'assistant', content: `${data.message || ""}, ${nextQuestion}` }]);
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
        fetchInitialQuestion(user);  // Fetch initial question as soon as user is authenticated
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
        return prev - 1;
      });
    }, 1000);

    // Check if the time left is 5 minutes (300 seconds)
    if (timeLeft <= 60 && timeLeft > 0) {
      setTimerStyle({
        color: "rgb(255, 85, 85)", // Slight red for attention
        fontSize: "1.25rem", // Slightly larger font size
        fontWeight: "600", // Bold text to enhance visibility
        textShadow: "0 0 8px rgba(255, 85, 85, 0.6), 0 0 15px rgba(255, 85, 85, 0.6)", // Soft glowing effect
        transform: "scale(1.1)", // Slight scaling effect to grab attention
        animation: "pulse_timer 3s ease-in-out infinite, flicker 3s ease-in-out infinite", // Apply the pulse and flicker animation for 3 seconds, repeat every minute (60s)
        transition: "all 0.5s ease-out", // Smooth transition for color, scale, and shadow
      });
    } 

    return () => {
      //isMounted.current = false;
      unsubscribe();
      clearInterval(timer);
    };
  }, [router, hasSessionExpired]);

  // Manage session expiration and loading state
  useEffect(() => {
    if (hasSessionExpired) {
      setLoading(false); // Set loading false when session expires
    }
  }, [hasSessionExpired, setLoading]);

  // Handle sending the conversation history (with loading state handling)
  useEffect(() => {
    if (hasSessionExpired && !isConversationSaved) {
      // Only trigger this after session has expired and once conversation hasn't been saved yet
      const auth = getAuth();
      const user = auth.currentUser;

      if (user && messages.length > 0) {
        sendConversationHistory(messages);
        setIsConversationSaved(true); // Flag that conversation has been saved
      }
    }
  }, [hasSessionExpired, messages, isConversationSaved]);

  const sendConversationHistory = async (conversation) => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user || !conversation || conversation.length === 0) {
      toast.error("No conversation history to save.");
      return;
    }

    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

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
      setTimeLeft( timeLeft);
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
  
  return (
    <div className="flex items-center justify-center  h-screen"
    style={{
      backgroundImage: "url('/secondary_background.webp')",
      backgroundSize: 'cover', 
      backgroundPosition: 'center', 
      backgroundRepeat: 'no-repeat', 
      backgroundAttachment: 'fixed',
    }}>
      <div className=" shadow-lg rounded-lg w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="chat_container text-white py-4 px-6 flex items-center">
          <img
            src="https://img.favpng.com/16/0/10/chatbot-logo-robotics-png-favpng-9dXq9bg2WxSjeC6BvTCb6kxNC.jpg"
            alt="Chatbot"
            className="w-10 h-10 rounded-full"
          />
          <div className="ml-4">
            <h1 className="text-lg">Stitch</h1>
            <p className="text-sm">Interview Simulator</p>
          </div>
          <div className="ml-auto">
            <div style={timerStyle} className="bg-gray-700 px-3 py-1 rounded text-sm">
              Timer: <span id="timer">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-3 py-3  bg-transparent">
          <label
            htmlFor="progress-bar"
            className="block text-sm font-medium text-white mb-1"
          >
            Interview Progress
          </label>
          <div className="relative w-full bg-white rounded h-4">
            <div
              id="progress-bar"
              className="absolute top-0 left-0 progress h-4 rounded"
              style={{ width: `${progress || 0}%` }} // Default to 0 if NaN
            ></div>
            <span
              id="progress-percentage"
              className="absolute right-2 text-xs font-medium text-gray-800"
            >
              {progress || 0}% {/* Default to 0 if NaN */}
            </span>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-grow chat-area overflow-y-auto p-4 space-y-4 bg-transparent">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.role === 'assistant' ? 'justify-start' : 'justify-end'
              } space-x-3`}
            >
              {msg.role === 'assistant' ? (
                <>
                  <img
                    src="https://img.favpng.com/16/0/10/chatbot-logo-robotics-png-favpng-9dXq9bg2WxSjeC6BvTCb6kxNC.jpg"
                    alt="assistant"
                    className="w-8 h-8 rounded-full"
                  />
                  {/* Chat Bubble */}
                  <div
                    className="max-w-[80%] p-3 text-sm text-gray-800 bg-gray-100 rounded-lg"
                  >
                    {msg.content || "No content"}
                  </div>
                </>
              ) : (
                <>
                  {/* User Message */}
                  <div className="flex flex-col items-end">
                    
                    <div
                      className="max-w-[80%] p-3 text-sm text-gray-800 bg-green-100 rounded-lg"
                    >
                      {msg.content || "No content"}
                      </div>
                      <span className="text-sm text-white mb-1">You</span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>



        {/* Input Field */}
        <form className="flex items-end space-x-2 m-3" onSubmit={handleSendMessage}>
            <textarea
              id="text"
              placeholder="Type your answer here..."
              className="flex-grow px-3 py-2 form-control-chat text-white border resize-none chat-area overflow-y-auto"
              rows="1"
              style={{
                minHeight: "40px", 
                maxHeight: "80px",
                height: "auto", 
              }}
              onInput={(e) => {
                e.target.style.height = "auto"; // Reset height to auto to calculate new height
                e.target.style.height = `${e.target.scrollHeight}px`; // Set new height based on scrollHeight
              }}
            />
            <button
              type="submit"
              id="send"
            className="sendMsg-btn px-4 py-2 flex-shrink-0"
            style={{
              height: "100%", // Make button the same height as textarea
            }}
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </form>

      </div>
    </div>
  );
}
