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

    socketRef.current.emit('join_support', userId); // Reusing this event since it puts user in `user_${userId}`

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userRes, convRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/users/me`, { headers: { 'x-auth-token': token } }),
        axios.get(`${API_BASE_URL}/api/chats`, { headers: { 'x-auth-token': token } })
      ]);
      
      setCurrentUser(userRes.data);
      let convs = convRes.data;
      
      // If we came from a profile with a receiverId
      if (location.state?.receiverId) {
        const existing = convs.find(c => c.participants.some(p => p._id === location.state.receiverId));
        if (existing) {
          setActiveChat(existing);
          fetchMessages(existing._id);
        } else {
          // Virtual conversation
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
          <div className="dashboard-content-wrapper" style={{ height: 'calc(100vh - 100px)', paddingBottom: '0' }}>
            <div style={{ display: 'flex', height: '100%', gap: '24px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
              
              {/* Sidebar List */}
              <div style={{ width: '300px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
                  <h3 style={{ margin: 0 }}>Повідомлення</h3>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {loading ? <div style={{ padding: '20px', textAlign: 'center' }}>Завантаження...</div> :
                   conversations.length === 0 ? <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Немає діалогів</div> :
                   conversations.map(chat => {
                     const otherUser = chat.participants.find(p => p._id !== currentUser?._id);
                     if (!otherUser) return null;
                     const isPending = chat.status === 'pending' && chat.initiator !== currentUser?._id;
                     
                     return (
                       <div 
                         key={chat._id}
                         onClick={() => selectChat(chat)}
                         style={{
                           padding: '16px',
                           borderBottom: '1px solid var(--border)',
                           cursor: 'pointer',
                           background: activeChat?._id === chat._id ? 'var(--bg-subtle)' : 'transparent',
                           display: 'flex',
                           gap: '12px',
                           alignItems: 'center'
                         }}
                       >
                         <img src={otherUser.avatarUrl || '/default-avatar.svg'} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                         <div style={{ flex: 1, overflow: 'hidden' }}>
                           <div style={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', color: 'var(--black)' }}>
                             {otherUser.username}
                             {isPending && <span style={{ fontSize: '0.7rem', background: 'var(--yellow)', color: 'var(--black)', padding: '2px 6px', border: '1px solid var(--black)' }}>Новий</span>}
                           </div>
                           <div style={{ fontSize: '0.85rem', color: 'var(--black)', opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                             {chat.lastMessage ? chat.lastMessage.text : '...'}
                           </div>
                         </div>
                       </div>
                     );
                   })
                  }
                </div>
              </div>

              {/* Chat Window */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {activeChat ? (
                  <>
                    <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {(() => {
                        const otherUser = activeChat.participants.find(p => p._id !== currentUser?._id);
                        return (
                          <>
                            <img src={otherUser?.avatarUrl || '/default-avatar.svg'} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                            <div>
                              <h4 style={{ margin: 0 }}><Link to={`/user/${otherUser?._id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{otherUser?.username}</Link></h4>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {messages.map((m, idx) => {
                        const isMe = m.sender._id === currentUser?._id || m.sender === currentUser?._id;
                        return (
                          <div key={idx} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                            <div style={{
                              background: isMe ? 'var(--accent)' : 'var(--bg)',
                              color: isMe ? 'var(--accent-text)' : 'var(--black)',
                              padding: '14px 18px',
                              borderRadius: isMe ? '0' : '0',
                              border: 'var(--border)',
                              boxShadow: 'var(--shadow-sm)',
                              fontFamily: 'var(--font-sans)',
                              lineHeight: '1.5'
                            }}>
                              {m.text}
                            </div>
                            <div style={{ 
                                fontSize: '0.7rem', 
                                color: 'var(--black)', 
                                opacity: 0.6,
                                marginTop: '6px', 
                                textAlign: isMe ? 'right' : 'left',
                                fontFamily: 'var(--font-mono)'
                            }}>
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    <div style={{ padding: '20px', borderTop: '1px solid var(--border)' }}>
                      {activeChat.status === 'pending' && activeChat.initiator !== currentUser?._id ? (
                        <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                          <p style={{ marginBottom: '16px' }}>Цей користувач не у вашому списку друзів. Прийняти повідомлення?</p>
                          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button className="btn btn-primary" onClick={handleAccept} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FiCheck /> Прийняти
                            </button>
                            <button className="btn btn-secondary" onClick={handleDelete} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
                              <FiX /> Видалити
                            </button>
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px' }}>
                          <input 
                            type="text" 
                            style={{ flex: 1, padding: '12px 16px', border: 'var(--border)', background: 'var(--bg)', color: 'var(--black)', fontFamily: 'var(--font-sans)', fontSize: '0.9rem', outline: 'none' }}
                            value={input} 
                            onChange={(e) => setInput(e.target.value)} 
                            placeholder="Напишіть повідомлення..."
                          />
                          <button type="submit" className="btn btn-primary" disabled={!input.trim()} style={{ padding: '0 24px' }}>
                            <FiSend />
                          </button>
                        </form>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                    <FiMessageSquare style={{ fontSize: '4rem', marginBottom: '16px', opacity: 0.5 }} />
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
