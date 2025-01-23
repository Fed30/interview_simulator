"use client";
import React, { useState, useEffect } from "react";
import '@fortawesome/fontawesome-free/css/all.min.css';
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useLoading } from '../context/LoadingContext';
import { toast } from 'react-toastify';

export default function Chat() {
  const [messages, setMessages] = useState([]); // Safe default initialization
  const [progress, setProgress] = useState(0); // Ensure progress is always a number
  const [currentQuestion, setCurrentQuestion] = useState('');
  const router = useRouter();
  const { setLoading } = useLoading();
  

  useEffect(() => {
    const auth = getAuth();
  
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Fetch initial question and restore data
        fetchInitialQuestion(user);
      } else {
        // Redirect to the login page if not authenticated
        router.push('/');
      }
    });
  
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [router]);
  

  const fetchInitialQuestion = async (user) => {
    try {
      // Fetch the ID token
      const idToken = await user.getIdToken(true);
  
      // Fetch conversation data from the server
      const response = await fetch('http://127.0.0.1:5000/chat', {
        method: 'GET',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${idToken}`, // Pass the ID token
        },
      });
  
      const data = await response.json();
  
      if (data.error) {
        toast.error("Error: " + data.error);
        console.error("Error fetching data:", data.error);
        return;
      }
  
      // Debugging: Log the response
      console.log("Response data:", data);
  
      // Safely handle missing conversation_history
      const conversationHistory = data.conversation_history || []; // Default to empty array
      const progressValue = Number(data.progress) || 0; // Default to 0
      const nextQuestion = data.next_question || "No more questions."; // Default to fallback
  
      if (conversationHistory.length > 0) {
        // Existing session
        setMessages(conversationHistory);
        setProgress(progressValue);
        setCurrentQuestion(nextQuestion);
      } else {
        // New session or no history available
        setMessages([
          { role: 'assistant', content: `${data.message || ""} ${nextQuestion}` },
        ]);
        setProgress(progressValue);
        setCurrentQuestion(nextQuestion);
      }
  
      console.log("Conversation history and progress restored successfully.");
    } catch (error) {
      toast.error("Failed to load the initial question. Please try again.");
      console.error("Fetch error:", error);
    }
  };
  
  
  

  const handleSendMessage = async (event) => {
    event.preventDefault();
    const messageInput = document.getElementById("text");
    const userMessage = messageInput.value.trim();

    if (!userMessage) return;

    // Add user message to the state
    const newMessages = [
      ...messages,
      { role: 'user', content: userMessage },
    ];
    setMessages(newMessages);

    try {
      // Send the user message to Flask backend
      const response = await fetch('http://127.0.0.1:5000/chat', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      if (data.error) {
        toast.error("Error: " + data.error);
        console.error("Error:", data.error);
        return;
      }

      // Update progress and assistant's response
      setProgress(Number(data.progress) || 0); // Ensure progress is a number
      const assistantMessages = [
        ...newMessages,
        { role: 'assistant', content: data.chatbot_response },
      ];

      if (!data.next_question) {
        // Add the final message
        assistantMessages.push({ role: 'assistant', content: data.final_message });
        setMessages(assistantMessages);

        // Delay to ensure state updates before saving conversation
        setTimeout(() => {
          sendConversationHistory(assistantMessages); // Save the conversation
        }, 1000);
      } else {
        // Add the next question
        assistantMessages.push({ role: 'assistant', content: data.next_question });
        setMessages(assistantMessages);
        setCurrentQuestion(data.next_question);
      }
    } catch (error) {
      toast.error("Error sending message. Please try again.");
      console.error("Error sending message:", error);
    }

    // Clear input field
    messageInput.value = '';
  };

  const sendConversationHistory = async (conversation) => {
    try {
      setLoading(true);
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setLoading(false);
        console.log("User not authenticated.");
        toast.error("User not authenticated.");
        return;
      }

      const idToken = await user.getIdToken(true);
      const response = await fetch('http://127.0.0.1:5000/save_conversation', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`, // Send the ID token
        },
        body: JSON.stringify({
          conversationHistory: conversation,
        }),
      });

      const data = await response.json();
      if (data.success) {
        console.log("Conversation history saved successfully!");
        setTimeout(() => {
          setLoading(false);
          toast.success("Practice Session Completed!");
        }, 3000);
        router.push("/"); // Redirect to home
      } else {
        setLoading(false);
        console.error("Error saving conversation history:", data.error);
        toast.error("Error saving conversation history: " + data.error);
      }
    } catch (error) {
      setLoading(false);
      console.error("Error sending conversation history:", error);
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
              Timer: <span id="timer">00:00:00</span>
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
