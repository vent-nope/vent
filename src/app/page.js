"use client";

import { useState, useEffect } from "react";
// 👇 [수정됨] 사용하지 않는 아이콘들은 다 뺐습니다! (에러 원인 제거)
import { Share2, ThumbsUp, MessageSquare, Send, Search, Trash2, Lock, Moon, Sun } from "lucide-react"; 
import Link from "next/link"; 

const API_URL = "https://vent-fab0.onrender.com";

export default function Home() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/complaints`);
      const data = await res.json();
      
      const stats = {};
      data.forEach(item => {
        const key = item.product.trim().toUpperCase(); 
        if (!stats[key]) {
          stats[key] = { ...item, product: item.product.trim() };
        } else {
             if(item.count > stats[key].count) {
                 stats[key] = { ...item, count: item.count };
             }
             if(!stats[key].image_url && item.image_url) {
                 stats[key].image_url = item.image_url;
                 stats[key].issue = item.issue;
                 stats[key].id = item.id;
             }
        }
      });
      const sortedList = Object.values(stats).sort((a, b) => b.count - a.count);
      setComplaints(sortedList.length === 0 ? [] : sortedList);
    } catch (error) {
      console.error("실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
        const res = await fetch(`${API_URL}/api/complaints/${id}?password=${adminPassword}`, { method: "DELETE" });
        const result = await res.json();
        if (result.message === "SUCCESS") { alert("삭제되었습니다."); fetchData(); }
        else if (result.message === "WRONG_PASSWORD") { alert("비밀번호 오류"); setIsAdmin(false); }
    } catch (err) { alert("오류"); }
  };

  const handleAdminLogin = () => {
      const pw = prompt("관리자 비밀번호:");
      if (pw) { setAdminPassword(pw); setIsAdmin(true); }
  };

  const filteredComplaints = complaints.filter((item) => 
    item.brand.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.product.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-gray-900 text-neutral-900 dark:text-gray-100 font-sans flex flex-col transition-colors duration-300">
      
      <nav className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
            <span className="font-black text-2xl tracking-tighter italic cursor-pointer">
              VENT<span className="text-red-600">.</span>
            </span>
          
          <div className="flex items-center gap-3">
            <button 
                onClick={toggleDarkMode}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-300"
            >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <Link href="/report">
                <button className="bg-neutral-900 dark:bg-white dark:text-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-neutral-700 dark:hover:bg-gray-200 transition shadow-lg">
                이슈 등록
                </button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="py-12 px-6 max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-extrabold mb-3 leading-tight">
          대한민국<br/>
          <span className="text-red-600 bg-red-50 dark:bg-red-900/30 px-2 rounded-lg">분노 랭킹</span>
        </h1>
        
        <div className="relative max-w-md mx-auto mt-8">
            <input 
                type="text"
                placeholder="검색어 입력..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-gray-800 border-2 border-neutral-900 dark:border-gray-600 rounded-full py-3 pl-12 pr-4 font-bold focus:outline-none focus:ring-4 dark:text-white transition shadow-sm"
            />
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-4 pb-12 w-full flex-1 space-y-6">
        {filteredComplaints.length === 0 ? (
            <div className="text-center py-20 text-gray-400 dark:text-gray-500"><p>등록된 이슈가 없습니다.</p></div>
        ) : (
            filteredComplaints.map((item, index) => (
              <div key={item.id} className="relative">
                  <ComplaintCard item={item} index={index} fetchData={fetchData} />
                  {isAdmin && (
                      <button onClick={() => handleDelete(item.id)} className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700 z-10">
                          <Trash2 className="w-4 h-4" />
                      </button>
                  )}
              </div>
            ))
        )}
      </section>
      
      <footer className="py-8 text-center text-gray-300 dark:text-gray-600 text-xs">
          <button onClick={handleAdminLogin} className="hover:text-gray-500 transition"><Lock className="w-3 h-3 inline-block mr-1" /> Admin</button>
      </footer>
    </main>
  );
}

function ComplaintCard({ item, index, fetchData }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  
  const getEvolutionStage = (count) => {
    if (count < 10) return { icon: "🐟", name: "송사리", next: 10 };
    if (count < 50) return { icon: "🐡", name: "복어", next: 50 };
    if (count < 100) return { icon: "🐙", name: "문어", next: 100 };
    if (count < 500) return { icon: "🐍", name: "독사", next: 500 };
    if (count < 1000) return { icon: "🐊", name: "악어", next: 1000 };
    if (count < 5000) return { icon: "🦈", name: "상어", next: 5000 };
    return { icon: "🐉", name: "드래곤", next: 10000 };
  };

  const evo = getEvolutionStage(item.count);
  const percent = Math.min((item.count / evo.next) * 100, 100);

  let cardStyle = "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700";
  let rankBadge = null;
  if (index === 0) {
    cardStyle = "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 shadow-yellow-200 dark:shadow-none shadow-lg ring-1 ring-yellow-400";
    rankBadge = <span className="bg-yellow-400 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">👑 1위</span>;
  } else if (index === 1) {
    cardStyle = "bg-slate-50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 shadow-md";
    rankBadge = <span className="bg-slate-400 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">🥈 2위</span>;
  } else if (index === 2) {
    cardStyle = "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700 shadow-md";
    rankBadge = <span className="bg-orange-400 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">🥉 3위</span>;
  }

  const fetchComments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/comments/${item.id}`);
      const data = await res.json();
      setComments(data || []);
    } catch (err) { console.error(err); }
  };

  const toggleComments = () => { if (!showComments) fetchComments(); setShowComments(!showComments); };

  const submitComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/comments`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaint_id: item.id, content: newComment })
      });
      if (res.ok) { setNewComment(""); fetchComments(); }
    } catch (err) {}
  };

  const handleVote = async () => {
    try {
        const res = await fetch(`${API_URL}/api/vote`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ complaint_id: item.id })
        });
        const result = await res.json();
        if (result.message === "SUCCESS") { alert("🔥 화력 보태기 성공!"); fetchData(); }
        else if (result.message === "ALREADY_VOTED") { alert("✋ 이미 공감하셨습니다."); }
    } catch (error) {}
  };

  const handleShare = async () => {
    const shareData = {
        title: `🚨 [VENT] ${item.product} 이슈`,
        text: `화력이 필요합니다! 현재 ${item.count}명 참여중.`,
        url: window.location.href,
    };
    try { if (navigator.share) await navigator.share(shareData); else { await navigator.clipboard.writeText(shareData.url); alert("복사됨!"); } } catch {}
  };

  return (
    <div className={`border rounded-2xl p-6 transition-all duration-300 ${cardStyle} hover:scale-[1.01]`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-4">
          <div className="relative w-14 h-14 bg-white dark:bg-gray-700 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-gray-100 dark:border-gray-600 shrink-0">
            {evo.icon}
            {index === 0 && <div className="absolute -top-3 -right-3 animate-bounce">👑</div>}
          </div>
          <div className="min-w-0">
            <div className="flex gap-2 mb-1">
                {rankBadge}
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-300 uppercase tracking-wider border border-gray-200 dark:border-gray-600 px-1.5 py-0.5 rounded bg-white dark:bg-gray-700 truncate">{item.brand}</span>
            </div>
            <h3 className="text-lg font-bold leading-tight break-keep dark:text-white">{item.product}</h3>
            <div className="flex items-center gap-1 mt-1">
                <span className="text-xs font-bold text-red-600 dark:text-red-400">{evo.name}</span>
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-2xl font-black text-neutral-900 dark:text-white block">{item.count}</span>
        </div>
      </div>

      {item.image_url && (
          <div className="mb-4 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm">
              <img src={item.image_url} alt="증거 사진" className="w-full h-auto object-cover max-h-96" />
          </div>
      )}

      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg leading-relaxed whitespace-pre-wrap">
          {item.issue}
      </p>

      <div className="mb-5">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-1000 ${index === 0 ? "bg-gradient-to-r from-yellow-400 to-red-500" : "bg-gradient-to-r from-red-500 to-red-600"}`} style={{ width: `${percent}%` }}></div>
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t border-gray-100/50 dark:border-gray-700">
        <button onClick={handleVote} className="flex-1 bg-white dark:bg-gray-800 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 group shadow-sm">
          <ThumbsUp className="w-4 h-4 group-hover:scale-110 transition" /> 공감
        </button>
        <button onClick={toggleComments} className="flex-1 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition">
          <MessageSquare className="w-4 h-4" /> 댓글
        </button>
        <button onClick={handleShare} className="w-12 bg-neutral-900 dark:bg-white dark:text-black text-white rounded-xl flex items-center justify-center shadow-lg active:scale-95">
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 -mx-6 px-6 pb-2">
            <div className="flex gap-2 mb-4">
                <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && submitComment()} placeholder="의견을 남겨주세요" className="flex-1 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neutral-900 dark:focus:border-gray-400" />
                <button onClick={submitComment} className="bg-neutral-900 dark:bg-white dark:text-black text-white px-3 rounded-lg hover:bg-neutral-700 dark:hover:bg-gray-200"><Send className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 max-h-60 overflow-y-auto">
                {comments.length === 0 ? (<p className="text-xs text-gray-400 text-center py-2">아직 댓글이 없습니다.</p>) : (
                    comments.map((cmt) => (
                        <div key={cmt.id} className="bg-white dark:bg-gray-700 p-3 rounded-lg border border-gray-100 dark:border-gray-600 shadow-sm text-sm">
                            <p className="text-gray-800 dark:text-gray-200">{cmt.content}</p>
                            <span className="text-[10px] text-gray-400 mt-1 block">{new Date(cmt.created_at).toLocaleDateString()}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
      )}
    </div>
  );
}