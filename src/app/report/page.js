"use client";

import { useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ReportPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    brand: "",
    product: "",
    issue: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 8001번 포트로 전송
      const response = await fetch("http://127.0.0.1:8001/api/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("성공! 당신의 분노가 접수되었습니다.");
        router.push("/"); 
      } else {
        alert("전송 실패.. 파이썬 서버가 켜져 있나요?");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("서버 연결 오류! (Backend가 꺼져 있을 수 있습니다)");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200 font-sans p-6 flex flex-col items-center justify-center">
      
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center text-neutral-500 hover:text-white mb-8 transition gap-2 font-bold text-sm">
          <ArrowLeft className="w-4 h-4" /> BACK TO HOME
        </Link>

        <div className="mb-10">
          <h1 className="text-4xl font-black text-white mb-2 italic tracking-tighter">
            VENT<span className="text-red-600">.</span>
          </h1>
          <p className="text-neutral-400">무엇이 당신을 화나게 했나요? 데이터로 남기세요.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase tracking-wide">Brand Name</label>
            <input 
              type="text" 
              placeholder="예: Samsung, Apple" 
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-white placeholder-neutral-600 focus:outline-none focus:border-red-600 transition font-medium"
              value={formData.brand}
              onChange={(e) => setFormData({...formData, brand: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase tracking-wide">Product Model</label>
            <input 
              type="text" 
              placeholder="예: Galaxy S24 Ultra" 
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-white placeholder-neutral-600 focus:outline-none focus:border-red-600 transition font-medium"
              value={formData.product}
              onChange={(e) => setFormData({...formData, product: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase tracking-wide">Issue Description</label>
            <textarea 
              rows="4"
              placeholder="불만 내용을 적어주세요." 
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-white placeholder-neutral-600 focus:outline-none focus:border-red-600 transition font-medium resize-none"
              value={formData.issue}
              onChange={(e) => setFormData({...formData, issue: e.target.value})}
              required
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full font-bold py-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg ${
              isSubmitting ? "bg-neutral-700 text-neutral-400" : "bg-red-600 hover:bg-red-700 text-white shadow-red-900/20 active:scale-95"
            }`}
          >
            {isSubmitting ? "접수 중..." : <><Send className="w-5 h-5" /> VENT IT NOW</>}
          </button>

        </form>

        <p className="text-center text-xs text-neutral-600 mt-8">
          제출된 데이터는 익명으로 처리되며 기업 리포트에 활용됩니다.
        </p>
      </div>

    </main>
  );
}