import React, { useState, useEffect, useRef } from 'react';
import { BACKEND } from '../utils/config.js';
import io from 'socket.io-client';
import axios from 'axios'; // Re-added for fetchChatHistory
import ReactMarkdown from 'react-markdown';

const ChatWindow = ({ project, currentUser }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [showUserListDropdown, setShowUserListDropdown] = useState(false);
  const userListDropdownRef = useRef(null); // For closing dropdown on outside click
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [showReactionPickerFor, setShowReactionPickerFor] = useState(null); // Stores messageId
  const availableReactions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
  const [isRefiningMessage, setIsRefiningMessage] = useState(false);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!currentUser?._id) { // Only need currentUser to exist to attempt connection
      return;
    }

    const newSocketInstance = io(BACKEND);
    setSocket(newSocketInstance); // Store the single socket instance

    newSocketInstance.on('connect', () => {
    });

    newSocketInstance.on('disconnect', (reason) => {
    });

    newSocketInstance.on('connect_error', (err) => {
    });

    // Cleanup: Disconnect socket when ChatWindow unmounts or currentUser changes significantly (e.g., logout)
    return () => {
      newSocketInstance.disconnect();
      setSocket(null); // Clear the socket from state
    };
  }, [currentUser?._id]); // Re-run if currentUser._id changes (e.g. login/logout)

  // Effect for joining rooms and handling project-specific events
  useEffect(() => {
    if (!socket || !project?._id || !currentUser?._id) {
      // If there's no socket, or no project/user to join a room for, do nothing or clean up.
      // If socket exists but no project, could emit 'leavePreviousRoom' if applicable.
      return;
    }

    // Join project room
    socket.emit('joinProjectRoom', { projectId: project._id, userId: currentUser._id });

    // Event listeners
    const handleOnlineUsers = ({ projectId: incomingProjectId, onlineUserIds: updatedOnlineUserIds }) => {
      if (incomingProjectId === project._id) setOnlineUserIds(new Set(updatedOnlineUserIds));
    };
    const handleNewMessage = (message) => {
      if (message.project === project._id) setMessages((prev) => [...prev, message]);
    };
    const handleUserTyping = ({ userId: typingUserId, userName: typingUserName, projectId: incomingProjectId }) => {
      if (incomingProjectId === project._id) {
        setTypingUsers(prev => ({ ...prev, [typingUserId]: typingUserName }));
      }
    };
    const handleUserStopTyping = ({ userId: typingUserId, projectId: incomingProjectId }) => {
      if (incomingProjectId === project._id) {
        setTypingUsers(prev => {
          const updated = { ...prev };
          delete updated[typingUserId];
          return updated;
        });
      }
    };
    const handleUpdateReactions = ({ messageId, reactions }) => {
      setMessages(prev => prev.map(msg => msg._id === messageId ? { ...msg, reactions: reactions || {} } : msg));
    };
    const handleRefinedMessage = ({ refinedText }) => {
      setNewMessage(refinedText);
      setIsRefiningMessage(false);
      document.querySelector('.chat-textarea')?.focus();
    };

    socket.on('updateOnlineUsers', handleOnlineUsers);
    socket.on('newMessage', handleNewMessage);
    socket.on('userTyping', handleUserTyping);
    socket.on('userStopTyping', handleUserStopTyping);
    socket.on('updateMessageReactions', handleUpdateReactions);
    socket.on('refinedMessageResponse', handleRefinedMessage);

    // Cleanup for this effect (when project changes or socket disconnects)
    return () => {
      socket.off('updateOnlineUsers', handleOnlineUsers);
      socket.off('newMessage', handleNewMessage);
      socket.off('userTyping', handleUserTyping);
      socket.off('userStopTyping', handleUserStopTyping);
      socket.off('updateMessageReactions', handleUpdateReactions);
      socket.off('refinedMessageResponse', handleRefinedMessage);
      // Optionally emit 'leaveProjectRoom' if your backend handles it
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [socket, project?._id, currentUser?._id]); // Re-run if socket, project, or user changes

  // Effect to handle clicks outside the user list dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (userListDropdownRef.current && !userListDropdownRef.current.contains(event.target)) {
        // Check if the click was on the info button itself to avoid immediate re-closing
        // The button now has id="user-list-toggle-button"
        if (!event.target.closest('#user-list-toggle-button')) {
             setShowUserListDropdown(false);
        }
      }
    }
    if (showUserListDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserListDropdown]);

  // Effect for fetching chat history
  useEffect(() => {
    if (!project?._id) return;

    const fetchChatHistory = async () => {
      try {
        const response = await axios.get(
          `${BACKEND}/project/chat-history/${project._id}`,
          { withCredentials: true }
        );
        setMessages(response.data.chatHistory || []);
      } catch (error) {
        setMessages([]); // Set to empty array on error
      }
    };

    fetchChatHistory();
  }, [project?._id]);

  const handleTyping = () => {
    // Ensure all necessary data is present, especially currentUser._id for stopTyping
    if (socket && project?._id && currentUser?._id && currentUser?.name) { 
      socket.emit('typing', { projectId: project._id, userId: currentUser._id, userName: currentUser.name });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        // Check again before emitting stopTyping, in case state changed
        if (socket && project?._id && currentUser?._id) { 
          socket.emit('stopTyping', { projectId: project._id, userId: currentUser._id });
        }
      }, 1000); // Changed to 1 second
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() && socket && project?._id && currentUser?._id) {
      const messageData = {
        projectId: project._id,
        userId: currentUser._id,
        message: newMessage.trim(),
      };
      socket.emit('sendMessage', messageData);
      setNewMessage('');
    }
  };

  const handleToggleReaction = (messageId, emoji) => {
    if (!socket || !project?._id || !currentUser?._id) return;
    // Optimistic update (optional, backend will confirm)
    // setMessages(prevMessages =>
    //   prevMessages.map(msg => {
    //     if (msg._id === messageId) {
    //       const newReactions = { ...(msg.reactions || {}) };
    //       const usersForEmoji = newReactions[emoji] || [];
    //       if (usersForEmoji.includes(currentUser._id)) {
    //         newReactions[emoji] = usersForEmoji.filter(uid => uid !== currentUser._id);
    //         if (newReactions[emoji].length === 0) delete newReactions[emoji];
    //       } else {
    //         newReactions[emoji] = [...usersForEmoji, currentUser._id];
    //       }
    //       return { ...msg, reactions: newReactions };
    //     }
    //     return msg;
    //   })
    // );

    socket.emit('messageReaction', {
      projectId: project._id,
      messageId,
      emoji,
      userId: currentUser._id,
    });
    setShowReactionPickerFor(null); // Close picker after reacting
  };

  const handleRefineMessage = () => {
    if (!newMessage.trim() || !socket || !project?._id || !currentUser?._id || isRefiningMessage) return;

    setIsRefiningMessage(true);
    socket.emit('refineMessageRequest', {
      projectId: project._id,
      userId: currentUser._id,
      textToRefine: newMessage.trim(),
    });
  };

  // Get an array of names of users currently typing, excluding the current user
  const typingDisplayNames = Object.entries(typingUsers)
    .filter(([userId, userName]) => userId !== currentUser?._id && userName) // Exclude self, ensure userName exists, check currentUser
    .map(([userId, userName]) => userName);

  if (!project || !currentUser) {
    return <div className="p-4 text-gray-400">Loading chat... Make sure project and user are selected.</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-800 text-white p-4">
      {/* Chat Header with User List Toggle */}
      <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
        <h2 className="text-xl font-semibold">
          Chat for {project.name}
        </h2>
        <div className="relative">
          <button 
            id="user-list-toggle-button" // Ensure this ID is present for click outside logic
            onClick={() => setShowUserListDropdown(!showUserListDropdown)} 
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#fff' }}
            title="View project members"
          >
            {/* Heroicon: information-circle (outline) */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </button>
          {showUserListDropdown && (
            <div
              ref={userListDropdownRef}
              className="absolute right-0 mt-2 w-72 bg-gray-750 border border-gray-600 rounded-md shadow-xl z-20"
            >
              <div className="px-4 py-3 border-b border-gray-600">
                 <h3 className="text-md font-semibold text-white">Project Members</h3>
              </div>
              {project.members && project.members.length > 0 ? (
                <ul className="max-h-60 overflow-y-auto py-1">
                  {project.members.sort((a, b) => a.name.localeCompare(b.name)).map(member => (
                    <li key={member._id} className="flex items-center px-4 py-2.5 hover:bg-gray-650 transition-colors duration-150">
                      <span className={`w-2.5 h-2.5 rounded-full mr-3 ${onlineUserIds.has(member._id) ? 'bg-green-400 ring-1 ring-green-300' : 'bg-red-500 ring-1 ring-red-400'}`}></span>
                      {member.photo && <img src={member.photo} alt={member.name} className="w-7 h-7 rounded-full mr-2.5 border border-gray-500" />}
                      <span className="text-sm text-gray-200 truncate" title={member.name}>{member.name}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-4 py-3 text-sm text-gray-400">No members found in this project.</p>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex-grow overflow-y-auto mb-4 space-y-4 pr-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-gray-500 mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-3.862 8.25-8.625 8.25S3.75 16.556 3.75 12 7.612 3.75 12.375 3.75 21 7.444 21 12z" />
            </svg>
            <p className="text-gray-500 text-center text-lg">No messages yet.</p>
            <p className="text-gray-600 text-center text-sm">Start the conversation!</p>
          </div>
        )}
        {messages.map((msg, index) => {
          const isAIMessage = msg.isAIMessage; // Use the boolean flag from backend
          const isCurrentUser = !isAIMessage && msg.user && msg.user._id === currentUser._id;
          const currentReactions = msg.reactions || {};

          const userAvatar = !isCurrentUser && !isAIMessage && msg.user && msg.user.photo && (
            <img src={msg.user.photo} alt={msg.user.name} className="w-8 h-8 rounded-full mr-2.5 self-end mb-0.5" />
          );

          const aiAvatar = isAIMessage && (
            <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-semibold mr-2.5 self-end mb-0.5 shadow">
              AI
            </div>
          );

          return (
            <div 
              key={msg._id || index} 
              className={`relative flex my-2.5 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              onMouseEnter={() => setHoveredMessageId(msg._id)}
              onMouseLeave={() => setHoveredMessageId(null)}
            >
              {!isCurrentUser && (userAvatar || aiAvatar)}
              <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                {!isCurrentUser && !isAIMessage && (
                  <p className="text-xs text-gray-400 mb-0.5 ml-1.5 font-medium">{msg.user && msg.user.name ? msg.user.name : '@AI'}</p>
                )}
                <div
                  className={`
                    relative group py-2.5 px-3.5 shadow-lg text-sm
                    ${isCurrentUser
                      ? 'bg-sky-500 text-white rounded-l-xl rounded-br-xl'
                      : isAIMessage
                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-gray-100 rounded-r-xl rounded-bl-xl'
                        : 'bg-gray-600 text-gray-100 rounded-r-xl rounded-bl-xl'
                    }
                  `}
                  style={{ maxWidth: '75%' }}
                >
                  {isAIMessage && !isCurrentUser && (
                     <p className="text-xs text-indigo-300 font-bold mb-1">{msg.user && msg.user.name ? msg.user.name : '@AI'}</p>
                  )}
                  <div className="prose prose-sm prose-invert max-w-none break-words whitespace-pre-wrap">
                    <ReactMarkdown>{msg.message}</ReactMarkdown>
                  </div>
                  {/* <p className="break-words whitespace-pre-wrap">{msg.message}</p> */}
                  <p className={`text-xs mt-1.5 ${isCurrentUser ? 'text-sky-200' : isAIMessage ? 'text-indigo-200' : 'text-gray-400'} text-right`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {/* Reaction Emojis Display */}
                  {Object.keys(currentReactions).length > 0 && (
                    <div className={`flex flex-wrap gap-1 mt-1.5 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                      {Object.entries(currentReactions).map(([emoji, users]) => (
                        users && users.length > 0 && (
                          <button 
                            key={emoji} 
                            onClick={() => handleToggleReaction(msg._id, emoji)}
                            className={`px-1.5 py-0.5 rounded-full text-xs flex items-center transition-colors duration-150 
                                        ${(users || []).includes(currentUser._id) 
                                          ? 'bg-blue-500 bg-opacity-70 hover:bg-opacity-90 text-white' 
                                          : 'bg-gray-500 bg-opacity-40 hover:bg-opacity-60 text-gray-200'}`}
                            title={(users || []).includes(currentUser._id) ? 'Remove reaction' : `React with ${emoji}`}
                          >
                            {emoji} <span className="ml-1 text-xs">{users.length}</span>
                          </button>
                        )
                      ))}
                    </div>
                  )}
                </div>
                {/* Add Reaction Button - shows on hover of message group */}
                {(hoveredMessageId === msg._id || showReactionPickerFor === msg._id) && !isAIMessage && (
                  <div className={`absolute z-10 ${isCurrentUser ? 'right-0 mr-1' : 'left-0 ml-9'} -bottom-3 flex items-center`}>
                    <button 
                      onClick={() => setShowReactionPickerFor(prev => prev === msg._id ? null : msg._id)}
                      className="p-1 bg-gray-700 hover:bg-gray-600 rounded-full shadow-md transition-colors duration-150"
                      title="Add reaction"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-300">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75s.168-.75.375-.75.375.336.375.75zm+4.5 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              {/* Reaction Picker Panel */}
              {showReactionPickerFor === msg._id && (
                <div className={`absolute z-20 mt-1 p-1.5 bg-gray-750 border border-gray-600 rounded-lg shadow-xl flex gap-1 
                              ${isCurrentUser ? 'right-0 mr-8' : 'left-0 ml-16'} -bottom-10`}>
                  {availableReactions.map(emoji => (
                    <button 
                      key={emoji} 
                      onClick={() => handleToggleReaction(msg._id, emoji)} 
                      className="p-1.5 text-lg hover:bg-gray-600 rounded-md transition-transform transform hover:scale-125"
                      title={`React with ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      {/* Typing indicator */}
      {typingDisplayNames.length > 0 && (
        <div className="text-sm text-gray-400 mb-2 h-5 px-1"> {/* Added px-1 for alignment, h-5 to reserve space */}
          {typingDisplayNames.join(', ')} {typingDisplayNames.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}
      <form onSubmit={handleSendMessage} className="border-t border-gray-700 pt-3 pb-2 px-1 mt-auto">
        <div className="flex items-center bg-gray-700 rounded-xl p-1 shadow-md">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            placeholder="Type a message..."
            className="flex-grow p-2 bg-gray-600 text-white rounded-l-md focus:ring-2 focus:ring-sky-500 focus:outline-none resize-none chat-textarea"
          />
          <button
            type="button"
            onClick={handleRefineMessage}
            disabled={!newMessage.trim() || isRefiningMessage}
            className="p-2 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed mx-1 rounded-md text-sm"
          >
            {isRefiningMessage ? 'Refining...' : 'Refine ✨'}
          </button>
          <button
            type="submit"
            className="bg-sky-500 hover:bg-sky-600 text-white font-semibold p-2.5 rounded-lg transition-colors flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-sky-400"
            disabled={!newMessage.trim() || !socket}
            aria-label="Send message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
