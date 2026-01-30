"use client";

import { useState, useEffect } from "react";
import { Users, Share2, Mail, Flame, ThumbsUp, Trophy, Medal } from "lucide-react"; 
import Link from "next/link"; 

export default function Home() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // ★ 사장님의 Render 주소 (수정할 필요 없음)
  const API_URL = "https://vent-fab0.onrender.com";

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/complaints`);
      const data = await res.json();
      
      const stats = {};
        
      data.forEach(item => {
        const key = item.product.trim().toUpperCase(); 
        if (!stats[key]) {
          stats[key] = {
            id: item.id,
            brand: item.brand,
            product: item.product.trim(), 
            issue: item.issue, 
            count: item.count,
          };
        } else {
             if(item.count > stats[key].count) {
                 stats[key].count = item.count;
                 stats[key].id = item.id;
             }
        }
      });

      // 카운트 높은 순서대로 정렬 (랭킹 산정)
      const sortedList = Object.values(stats).sort((a, b) => b.count - a.count);
      
      if (sortedList.length === 0) {
          setComplaints([]);
      } else {
          setComplaints(sortedList);
      }
    } catch (error) {
      console.error("서버 연결 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getEvolutionStage = (count) => {
    if (count < 10) return { icon: "🐟", name: "송사리 단계", desc: "미미한 존재감", next: 10 };
    if (count < 50) return { icon: "🐡", name: "복어 단계", desc: "독을 품기 시작함", next: 50 };
    if (count < 100) return { icon: "🐙", name: "문어 단계", desc: "소문이 퍼짐", next: 100 };
    if (count < 500) return { icon: "🐍", name: "독사 단계", desc: "기업이 위협을 느낌", next: 500 };
    if (count < 1000) return { icon: "🐊", name: "악어 단계", desc: "한번 물면 안 놓음", next: 1000 };
    if (count < 5000) return { icon: "🦈", name: "상어 단계", desc: "시장의 포식자", next: 5000 };
    return { icon: "🐉", name: "드래곤 단계", desc: "세상을 바꿈", next: 10000 };
  };

  const handleShare = async (item) => {
    const shareData = {
      title: `🚨 [VENT] ${item.product} 이슈 공론화`,
      text: `${item.brand} ${item.product} 문제 해결을 위해 화력이 필요합니다!\n현재 ${item.count}명이 모여서 '${getEvolutionStage(item.count).name}'가 되었습니다. 함께해주세요.`,
      url: window.location.href,
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
          await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n바로가기: ${shareData.url}`);
          alert("📋 복사되었습니다!");
      }
    } catch (err) {}
  };

  const handleVote = async (id) => {
      try {
          const res = await fetch(`${API_URL}/api/vote`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ complaint_id: id })
          });
          
          const result = await res.json();
          
          if (result.message === "SUCCESS") {
              alert("🔥 화력 보태기 성공! (랭킹이 올라갑니다!)");
              fetchData(); 
          } else if (result.message === "ALREADY_VOTED") {
              alert("✋ 이미 공감하셨습니다. (1인 1회)");
          } else {
              alert("오류가 발생했습니다.");
          }
      } catch (error) {
          console.error("투표 에러:", error);
          alert("서버 통신 오류");
      }
  };

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 font-sans flex flex-col">
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
            <span className="font-black text-2xl tracking-tighter italic cursor-pointer">
              VENT<span className="text-red-600">.</span>
            </span>
          <Link href="/report">
            <button className="bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-neutral-700 transition shadow-lg">
              이슈 등록하기
            </button>
          </Link>
        </div>
      </nav>

      <section className="py-12 px-6 max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-extrabold mb-3 leading-tight">
          대한민국<br/>
          <span className="text-red-600 bg-red-50 px-2 rounded-lg">분노 랭킹</span>
        </h1>
        <p className="text-gray-500 text-sm md:text-base">
          가장 많은 공감을 받은 이슈가<br/>
          세상을 바꿀 확률이 높습니다.
        </p>
      </section>

      <section className="max-w-2xl mx-auto px-4 pb-12 w-full flex-1 space-y-6">
        {complaints.map((item, index) => {
          const evo = getEvolutionStage(item.count);
          const percent = Math.min((item.count / evo.next) * 100, 100);

          // 🏆 랭킹 스타일 적용 로직
          let rankBadge = null;
          let cardStyle = "bg-white border-gray-200"; // 기본 스타일
          let rankIcon = null;

          if (index === 0) { // 1등
            cardStyle = "bg-yellow-50 border-yellow-400 shadow-yellow-200 shadow-lg ring-1 ring-yellow-400";
            rankBadge = <span className="bg-yellow-400 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">👑 현재 1위</span>;
            rankIcon = <Trophy className="w-5 h-5 text-yellow-600 mb-1" />;
          } else if (index === 1) { // 2등
            cardStyle = "bg-slate-50 border-slate-300 shadow-md";
            rankBadge = <span className="bg-slate-400 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">🥈 2위</span>;
          } else if (index === 2) { // 3등
            cardStyle = "bg-orange-50 border-orange-200 shadow-md";
            rankBadge = <span className="bg-orange-400 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">🥉 3위</span>;
          }

          return (
            <div key={index} className={`border rounded-2xl p-6 transition-all duration-300 ${cardStyle} hover:scale-[1.01]`}>
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4">
                  {/* 진화 아이콘 */}
                  <div className="relative w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-gray-100">
                    {evo.icon}
                    {/* 1등일 경우 왕관 씌우기 */}
                    {index === 0 && <div className="absolute -top-3 -right-3 text-2xl animate-bounce">👑</div>}
                  </div>
                  
                  <div>
                    <div className="flex gap-2 mb-1">
                        {rankBadge}
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border border-gray-200 px-1.5 py-0.5 rounded bg-white">{item.brand}</span>
                    </div>
                    <h3 className="text-lg font-bold leading-tight">{item.product}</h3>
                    <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs font-bold text-red-600">{evo.name}</span>
                        <span className="text-[10px] text-gray-400">({evo.desc})</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {rankIcon}
                  <span className="text-2xl font-black text-neutral-900 block">{item.count}</span>
                </div>
              </div>

              <div className="mb-5">
                <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1 uppercase">
                  <span>Evolution Progress</span>
                  <span>Next: {evo.next}명</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${index === 0 ? "bg-gradient-to-r from-yellow-400 to-red-500" : "bg-gradient-to-r from-red-500 to-red-600"}`}
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
              </div>

              {/* 하단 버튼 영역 */}
              <div className="flex gap-2 pt-4 border-t border-gray-100/50">
                <button 
                  onClick={() => handleVote(item.id)}
                  className="flex-1 bg-white border border-red-100 text-red-600 hover:bg-red-50 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition active:scale-95 group shadow-sm"
                >
                  <ThumbsUp className="w-4 h-4 group-hover:scale-110 transition" /> 
                  공감해요
                </button>

                <button 
                  onClick={() => handleShare(item)}
                  className="flex-1 bg-neutral-900 text-white hover:bg-neutral-700 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg active:scale-95"
                >
                  <Share2 className="w-4 h-4" /> 
                  친구 소환
                </button>
              </div>

            </div>
          );
        })}
      </section>
    </main>
  );
}