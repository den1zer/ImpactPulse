import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLocation, Link } from 'react-router-dom';
import API_BASE_URL from '../config/api.js';
import AnimatedPage from '../components/AnimatedPage';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import { io } from 'socket.io-client';
import { FiSend, FiMessageSquare, FiCheck, FiX, FiArrowLeft } from 'react-icons/fi';
import playSound from '../utils/sounds';
import '../styles/Dashboard.css';
import '../styles/MessagesPage.css';

/**
 * MessagesPage Component
 * Provides a real-time messaging interface using Socket.IO.
 * Users can interact with existing conversations or initiate new ones.
 *
 * @returns {JSX.Element} The rendered messages page.
 */
const MessagesPage = () => {
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const location = useLocation();
  
  const token = localStorage.getItem('userToken');
  const userId = localStorage.getItem('userId');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchData();

    socketRef.current = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    socketRef.current.emit('join_support', userId);

    socketRef.current.on('new_message', (data) => {
      const { conversation, message } = data;
      playSound('success', 0.2);
      
      setConversations(prev => {
        const exists = prev.find(c => c._id === conversation._id);
        if (exists) {
            return prev.map(c => c._id === conversation._id ? { ...c, lastMessage: message, status: conversation.status } : c);
        } else {
            return [{ ...conversation, lastMessage: message }, ...prev];
        }
      });

      setActiveChat(prevActive => {
          if (prevActive && prevActive._id === conversation._id) {
              setMessages(prev => [...prev, message]);
              return { ...prevActive, status: conversation.status };
          }
          return prevActive;
      });
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  /**
   * Fetches the user's active conversations and handles potential redirects
   * from user profiles (virtual chats).
   */
  const fetchData = async () => {
    try {
      setLoading(true);
      const [userRes, convRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/users/me`, { headers: { 'x-auth-token': token } }),
        axios.get(`${API_BASE_URL}/api/chats`, { headers: { 'x-auth-token': token } })
      ]);
      
      setCurrentUser(userRes.data);
      let convs = convRes.data;
      
      if (location.state?.receiverId) {
        const existing = convs.find(c => c.participants.some(p => p._id === location.state.receiverId));
        if (existing) {
          setActiveChat(existing);
          fetchMessages(existing._id);
        } else {
          const virtualChat = {
             _id: 'virtual',
             participants: [
                 userRes.data,
                 { _id: location.state.receiverId, username: location.state.receiverName, avatarUrl: location.state.receiverAvatar }
             ],
             status: 'pending',
             initiator: userRes.data._id
          };
          setActiveChat(virtualChat);
        }
      }
      setConversations(convs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Loads message history for a specific conversation.
   *
   * @param {string} chatId - The ID of the conversation.
   */
  const fetchMessages = async (chatId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/chats/${chatId}/messages`, {
        headers: { 'x-auth-token': token }
      });
      setMessages(res.data);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error(err);
    }
  };

  const selectChat = (chat) => {
    setActiveChat(chat);
    if (chat._id !== 'virtual') {
      fetchMessages(chat._id);
    } else {
      setMessages([]);
    }
  };

  /**
   * Submits a new message to the active chat.
   *
   * @param {React.FormEvent} e - The form submission event.
   */
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeChat) return;

    const text = input;
    setInput('');
    playSound('click', 0.1);

    try {
      const receiver = activeChat.participants.find(p => p._id !== currentUser._id);
      const res = await axios.post(`${API_BASE_URL}/api/chats/message`, 
        { receiverId: receiver._id, text },
        { headers: { 'x-auth-token': token } }
      );
      
      const newMsg = res.data.message;
      const newConv = res.data.conversation;

      if (activeChat._id === 'virtual') {
          setActiveChat(newConv);
          setConversations(prev => [{ ...newConv, lastMessage: newMsg }, ...prev]);
      } else {
          setConversations(prev => prev.map(c => c._id === newConv._id ? { ...c, lastMessage: newMsg, status: newConv.status } : c));
      }
      setMessages(prev => [...prev, newMsg]);
      setTimeout(scrollToBottom, 100);
      
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  const handleAccept = async () => {
    try {
      const res = await axios.put(`${API_BASE_URL}/api/chats/${activeChat._id}/accept`, {}, { headers: { 'x-auth-token': token } });
      setActiveChat(res.data);
      setConversations(prev => prev.map(c => c._id === res.data._id ? { ...c, status: 'accepted' } : c));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/chats/${activeChat._id}`, { headers: { 'x-auth-token': token } });
      setConversations(prev => prev.filter(c => c._id !== activeChat._id));
      setActiveChat(null);
      setMessages([]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <DashboardHeader />
        <AnimatedPage>
          <div className="dashboard-content-wrapper messages-wrapper">
            <div className={`messages-container ${activeChat ? 'chat-active' : ''}`}>
              
              <div className="messages-sidebar">
                <div className="messages-sidebar-header">
                  <h3>Повідомлення</h3>
                </div>
                <div className="messages-list">
                  {loading ? <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>Завантаження...</div> :
                   conversations.length === 0 ? <div style={{ padding: '20px', textAlign: 'center', color: 'var(--black)', opacity: 0.5, fontFamily: 'var(--font-mono)' }}>Немає діалогів</div> :
                   conversations.map(chat => {
                     const otherUser = chat.participants.find(p => p._id !== currentUser?._id);
                     if (!otherUser) return null;
                     const isPending = chat.status === 'pending' && chat.initiator !== currentUser?._id;
                     
                     return (
                       <div 
                         key={chat._id}
                         onClick={() => selectChat(chat)}
                         className={`messages-list-item ${activeChat?._id === chat._id ? 'active' : ''}`}
                       >
                         <img src={otherUser.avatarUrl || '/default-avatar.svg'} alt="" className="msg-avatar" />
                         <div className="msg-preview">
                           <div className="msg-preview-header">
                             {otherUser.username}
                             {isPending && <span className="msg-new-badge">Новий</span>}
                           </div>
                           <div className="msg-text-snippet">
                             {chat.lastMessage ? chat.lastMessage.text : '...'}
                           </div>
                         </div>
                       </div>
                     );
                   })
                  }
                </div>
              </div>

              <div className="messages-chat-area">
                {activeChat ? (
                  <>
                    <div className="chat-header">
                      <button className="mobile-back-btn" onClick={() => setActiveChat(null)}>
                        <FiArrowLeft size={18} />
                      </button>
                      {(() => {
                        const otherUser = activeChat.participants.find(p => p._id !== currentUser?._id);
                        return (
                          <>
                            <img src={otherUser?.avatarUrl || '/default-avatar.svg'} alt="" className="msg-avatar" style={{ width: '36px', height: '36px' }} />
                            <div>
                              <h4><Link to={`/user/${otherUser?._id}`}>{otherUser?.username}</Link></h4>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    <div className="chat-messages">
                      {messages.map((m, idx) => {
                        const isMe = m.sender._id === currentUser?._id || m.sender === currentUser?._id;
                        return (
                          <div key={idx} className={`chat-bubble-wrapper ${isMe ? 'me' : 'other'}`}>
                            <div className="chat-bubble">
                              {m.text}
                            </div>
                            <div className="chat-time">
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-input-area">
                      {activeChat.status === 'pending' && activeChat.initiator !== currentUser?._id ? (
                        <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg)', border: 'var(--border)' }}>
                          <p style={{ marginBottom: '16px', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Цей користувач не у вашому списку друзів. Прийняти повідомлення?</p>
                          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button onClick={handleAccept} style={{ background: 'var(--black)', color: 'var(--bg-surface)', border: 'var(--border)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700 }}>
                              <FiCheck /> Прийняти
                            </button>
                            <button onClick={handleDelete} style={{ background: 'var(--red)', color: '#fff', border: 'var(--border)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700 }}>
                              <FiX /> Видалити
                            </button>
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={handleSend} className="chat-form">
                          <input 
                            type="text" 
                            className="chat-input"
                            value={input} 
                            onChange={(e) => setInput(e.target.value)} 
                            placeholder="Напишіть повідомлення..."
                          />
                          <button type="submit" className="chat-send-btn" disabled={!input.trim()}>
                            <FiSend size={18} />
                          </button>
                        </form>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="chat-empty">
                    <FiMessageSquare />
                    <p>Оберіть діалог для початку спілкування</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </AnimatedPage>
      </main>
    </div>
  );
};

export default MessagesPage;
