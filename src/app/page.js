"use client";

import { useState, useEffect } from "react";
import { Users, Share2, Mail, AlertCircle } from "lucide-react"; // 아이콘 추가
import Link from "next/link"; 

export default function Home() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8001/api/complaints");
        const data = await res.json();
        
        const stats = {};
        
        data.forEach(item => {
          const key = item.product.trim().toUpperCase(); 
          if (!stats[key]) {
            stats[key] = {
              id: key, 
              brand: item.brand,
              product: item.product.trim(), 
              issue: item.issue, 
              count: 0,
            };
          }
          stats[key].count += 1;
        });

        const sortedList = Object.values(stats).sort((a, b) => b.count - a.count);
        
        if (sortedList.length === 0) {
           setComplaints([{ id: 99, brand: "SYSTEM", product: "아직 등록된 이슈가 없습니다", issue: "첫 번째 불만을 제기하여 변화를 시작하세요.", count: 0 }]);
        } else {
           setComplaints(sortedList);
        }
      } catch (error) {
        console.error("서버 연결 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 🐟 진화 단계 계산기 (송사리 -> 상어 -> 용)
  const getEvolutionStage = (count) => {
    if (count < 10) return { icon: "🐟", name: "송사리 단계", desc: "아직은 미미한 존재감", next: 10 };
    if (count < 50) return { icon: "🐡", name: "복어 단계", desc: "독을 품기 시작함", next: 50 };
    if (count < 100) return { icon: "🐙", name: "문어 단계", desc: "여러 곳에 소문이 퍼짐", next: 100 };
    if (count < 500) return { icon: "🐍", name: "독사 단계", desc: "기업이 위협을 느낌", next: 500 };
    if (count < 1000) return { icon: "🐊", name: "악어 단계", desc: "한번 물면 놓지 않음", next: 1000 };
    if (count < 5000) return { icon: "🦈", name: "상어 단계", desc: "시장의 포식자", next: 5000 };
    return { icon: "🐉", name: "드래곤 단계", desc: "세상을 바꾸는 힘", next: 10000 };
  };

  const handleShare = async (item) => {
    const shareData = {
      title: `🚨 [VENT] ${item.product} 이슈 공론화`,
      text: `${item.brand} ${item.product} 문제 해결을 위해 화력이 필요합니다!\n현재 ${item.count}명이 모여서 '${getEvolutionStage(item.count).name}'가 되었습니다. 함께해주세요.`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n바로가기: ${shareData.url}`);
        alert("📋 화력 지원 문구가 복사되었습니다!");
      }
    } catch (err) {
      console.log("공유 취소됨");
    }
  };

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 font-sans flex flex-col">
      
      {/* 네비게이션 */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="font-black text-2xl tracking-tighter italic cursor-pointer">
              VENT<span className="text-red-600">.</span>
            </span>
          </div>
          <Link href="/report">
            <button className="bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-neutral-700 transition shadow-lg shadow-neutral-500/20">
              이슈 등록하기
            </button>
          </Link>
        </div>
      </nav>

      {/* 💰 상단 광고 영역 (돈 벌어야죠!) */}
      <div className="max-w-2xl mx-auto w-full px-4 mt-6">
        <div className="w-full h-20 bg-gray-100 rounded-xl border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm font-medium">
          광고 배너 영역 (Google AdSense)
        </div>
      </div>

      {/* 헤더 */}
      <section className="py-12 px-6 max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-extrabold mb-3 leading-tight">
          우리의 분노는<br/>
          <span className="text-red-600 bg-red-50 px-2 rounded-lg">진화합니다.</span>
        </h1>
        <p className="text-gray-500 text-sm md:text-base">
          작은 송사리도 뭉치면 고래를 잡습니다.<br/>
          당신의 참여로 불만을 진화시키세요.
        </p>
      </section>

      {/* 이슈 리스트 */}
      <section className="max-w-2xl mx-auto px-4 pb-12 w-full flex-1 space-y-6">
        {complaints.map((item, index) => {
          const evo = getEvolutionStage(item.count);
          const percent = Math.min((item.count / evo.next) * 100, 100);

          return (
            <div key={index} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              
              {/* 상단: 진화 아이콘 + 브랜드 */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4">
                  {/* 진화 아이콘 (이모지) */}
                  <div className="w-14 h-14 bg-neutral-100 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-neutral-200">
                    {evo.icon}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border border-gray-200 px-1.5 py-0.5 rounded">{item.brand}</span>
                    <h3 className="text-lg font-bold mt-1 leading-tight">{item.product}</h3>
                    <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs font-bold text-red-600">{evo.name}</span>
                        <span className="text-[10px] text-gray-400">({evo.desc})</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-neutral-900">{item.count}</span>
                  <span className="text-xs text-gray-400 block font-bold">참여</span>
                </div>
              </div>

              {/* 중단: 경험치 바 (진화 게이지) */}
              <div className="mb-5">
                <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1 uppercase">
                  <span>Evolution Progress</span>
                  <span>Next: {evo.next}명</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-red-500 to-red-600 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(220,38,38,0.5)]" 
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
                <p className="text-xs text-right mt-1.5 text-gray-500 font-medium">
                  다음 진화까지 <span className="text-red-600 font-bold">{evo.next - item.count}명</span> 남았습니다!
                </p>
              </div>

              {/* 하단 버튼 */}
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button 
                  onClick={() => handleShare(item)}
                  className="flex-1 bg-black text-white hover:bg-neutral-800 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-neutral-200 active:scale-95 group"
                >
                  <Share2 className="w-4 h-4 group-hover:animate-bounce" /> 
                  친구 소환해서 진화시키기
                </button>
              </div>

            </div>
          );
        })}

        {/* 💰 리스트 중간 광고 (돈 벌어야죠 2) */}
        {complaints.length > 3 && (
            <div className="w-full h-24 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm font-medium">
            광고 배너 영역 2
            </div>
        )}

      </section>

      {/* 푸터 (오류 문의 & 정보) */}
      <footer className="bg-neutral-900 text-neutral-400 py-10 mt-auto">
        <div className="max-w-2xl mx-auto px-6 text-center">
            <h2 className="text-xl font-black text-white italic mb-4">VENT<span className="text-red-600">.</span></h2>
            <div className="flex justify-center gap-6 text-sm font-medium mb-8">
                <span className="hover:text-white cursor-pointer transition">서비스 소개</span>
                <span className="hover:text-white cursor-pointer transition">개인정보처리방침</span>
                <span className="hover:text-white cursor-pointer transition">이용약관</span>
            </div>
            
            <div className="border-t border-neutral-800 pt-8 flex flex-col items-center gap-2">
                <p className="text-xs">
                    VENT는 소비자의 불만을 투명하게 공론화하는 비영리 목적의 플랫폼입니다.<br/>
                    데이터 삭제 요청 및 오류 제보는 아래 이메일로 연락주세요.
                </p>
                <a href="mailto:impelaqua@gmail.com" className="flex items-center gap-2 text-white hover:text-red-400 transition font-bold mt-2 border border-neutral-700 px-4 py-2 rounded-full">
                    <Mail className="w-4 h-4" /> 
                    impelaqua@gmail.com
                </a>
                <p className="text-[10px] text-neutral-600 mt-4">
                    © 2026 VENT Project. All rights reserved.
                </p>
            </div>
        </div>
      </footer>

    </main>
  );
}