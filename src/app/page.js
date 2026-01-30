"use client";

import { useState, useEffect } from "react";
import { Users, Share2, Mail, Flame, ThumbsUp, Trophy, MessageSquare, Send, Search, Trash2, Lock } from "lucide-react"; 
import Link from "next/link"; 

// ★ 사장님 Render 주소
const API_URL = "https://vent-fab0.onrender.com";

export default function Home() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/complaints`);
      const data = await res.json();
      
      // 중복 제거 및 최신 데이터 병합 로직
      const stats = {};
      data.forEach(item => {
        const key = item.product.trim().toUpperCase(); 
        // 같은 제품이라도 사진이 있는 최신 글을 우선해서 보여주거나, 가장 count가 높은 걸 대표로 씀
        if (!stats[key]) {
          stats[key] = { ...item, product: item.product.trim() };
        } else {
             // 기존 것보다 카운트가 크면 교체
             if(item.count > stats[key].count) {
                 stats[key] = { ...item, count: item.count };
             }
             // 만약 기존 것에 사진이 없는데, 새 것에 사진이 있다면? 사진 있는 걸로 교체 (보는 재미를 위해)
             if(!stats[key].image_url && item.image_url) {
                 stats[key].image_url = item.image_url;
                 stats[key].issue = item.issue; // 내용도 사진 쪽 걸로
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
    if (!confirm("정말 삭제하시겠습니까? (복구 불가)")) return;
    try {
        const res = await fetch(`${API_URL}/api/complaints/${id}?password=${adminPassword}`, { method: "DELETE" });
        const result = await res.json();
        if (result.message === "SUCCESS") { alert("삭제되었습니다."); fetchData(); }
        else if (result.message === "WRONG_PASSWORD") { alert("비밀번호 오류"); setIsAdmin(false); }
        else { alert("실패: " + result.error); }
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
    <main className="min-h-screen bg-neutral-50 text-neutral-900 font-sans flex flex-col">
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
            <span className="font-black text-2xl tracking-tighter italic cursor-pointer">
              VENT<span className="text-red-600">.</span>
            </span>
          <Link href="/report">
            <button className="bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-neutral-700 transition shadow-lg">
              이슈 등록
            </button>
          </Link>
        </div>
      </nav>

      <section className="py-12 px-6 max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-extrabold mb-3 leading-tight">
          대한민국<br/>
          <span className="text-red-600 bg-red-50 px-2 rounded-lg">분노 랭킹</span>
        </h1>
        <p className="text-gray-500 text-sm md:text-base mb-8">
          증거 사진으로 화력을 더하세요.<br/>
          우리의 목소리가 들리게 합시다.
        </p>

        <div className="relative max-w-md mx-auto">
            <input 
                type="text"
                placeholder="브랜드나 제품명을 검색해보세요"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border-2 border-neutral-900 rounded-full py-3 pl-12 pr-4 font-bold focus:outline-none focus:ring-4 focus:ring-neutral-200 transition shadow-sm"
            />
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-4 pb-12 w-full flex-1 space-y-6">
        {filteredComplaints.length === 0 ? (
            <div className="text-center py-20 text-gray-400"><p>등록된 이슈가 없습니다.</p></div>
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
      
      <footer className="py-8 text-center text-gray-300 text-xs">
          <p>© 2024 VENT. All rights reserved.</p>
          <button onClick={handleAdminLogin} className="mt-2 hover:text-gray-500 transition"><Lock className="w-3 h-3 inline-block mr-1" /> Admin</button>
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

  let cardStyle = "bg-white border-gray-200";
  let rankBadge = null;
  if (index === 0) {
    cardStyle = "bg-yellow-50 border-yellow-400 shadow-yellow-200 shadow-lg ring-1 ring-yellow-400";
    rankBadge = <span className="bg-yellow-400 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">👑 1위</span>;
  } else if (index === 1) {
    cardStyle = "bg-slate-50 border-slate-300 shadow-md";
    rankBadge = <span className="bg-slate-400 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">🥈 2위</span>;
  } else if (index === 2) {
    cardStyle = "bg-orange-50 border-orange-200 shadow-md";
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
          <div className="relative w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-gray-100 shrink-0">
            {evo.icon}
            {index === 0 && <div className="absolute -top-3 -right-3 animate-bounce">👑</div>}
          </div>
          <div className="min-w-0">
            <div className="flex gap-2 mb-1">
                {rankBadge}
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border border-gray-200 px-1.5 py-0.5 rounded bg-white truncate">{item.brand}</span>
            </div>
            <h3 className="text-lg font-bold leading-tight break-keep">{item.product}</h3>
            <div className="flex items-center gap-1 mt-1">
                <span className="text-xs font-bold text-red-600">{evo.name}</span>
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-2xl font-black text-neutral-900 block">{item.count}</span>
        </div>
      </div>

      {/* 📸 사진이 있으면 여기에 뜸! */}
      {item.image_url && (
          <div className="mb-4 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
              <img src={item.image_url} alt="증거 사진" className="w-full h-auto object-cover max-h-96" />
          </div>
      )}

      {/* 내용 */}
      <p className="text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg leading-relaxed whitespace-pre-wrap">
          {item.issue}
      </p>

      <div className="mb-5">
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-1000 ${index === 0 ? "bg-gradient-to-r from-yellow-400 to-red-500" : "bg-gradient-to-r from-red-500 to-red-600"}`} style={{ width: `${percent}%` }}></div>
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t border-gray-100/50">
        <button onClick={handleVote} className="flex-1 bg-white border border-red-100 text-red-600 hover:bg-red-50 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 group shadow-sm">
          <ThumbsUp className="w-4 h-4 group-hover:scale-110 transition" /> 공감
        </button>
        <button onClick={toggleComments} className="flex-1 bg-gray-50 text-gray-600 hover:bg-gray-100 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition">
          <MessageSquare className="w-4 h-4" /> 댓글
        </button>
        <button onClick={handleShare} className="w-12 bg