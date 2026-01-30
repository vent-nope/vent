"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ArrowLeft } from "lucide-react"; 

export default function Report() {
  const [brand, setBrand] = useState("");
  const [product, setProduct] = useState("");
  const [issue, setIssue] = useState("");
  const [image, setImage] = useState(null); 
  const [preview, setPreview] = useState(null); 
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  
  // ★ 사장님의 Render 주소 (확인 필수!)
  const API_URL = "https://vent-fab0.onrender.com";

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file)); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!brand || !product || !issue) return alert("빈칸을 모두 채워주세요!");
    
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("brand", brand);
      formData.append("product", product);
      formData.append("issue", issue);
      if (image) {
        formData.append("image", image); 
      }

      const res = await fetch(`${API_URL}/api/report`, {
        method: "POST",
        body: formData, 
      });

      const result = await res.json();
      
      if (result.message === "저장 성공") {
        alert("🔥 이슈가 등록되었습니다! 화력을 모아봅시다.");
        router.push("/");
      } else {
        alert("저장 실패: " + JSON.stringify(result));
      }
    } catch (error) {
      console.error(error);
      alert("서버 연결 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-neutral-900 font-sans">
      <nav className="border-b border-gray-100 p-4 sticky top-0 bg-white z-10">
        <div className="max-w-xl mx-auto flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition">
                <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="font-bold text-lg">이슈 제보하기</h1>
        </div>
      </nav>

      <div className="max-w-xl mx-auto p-6">
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-bold text-gray-500 mb-2">어떤 브랜드인가요?</label>
                <input 
                    type="text" 
                    placeholder="예: 삼성전자, 넥슨" 
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl p-4 font-bold text-lg focus:outline-none focus:border-neutral-900 transition"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-500 mb-2">제품명</label>
                <input 
                    type="text" 
                    placeholder="예: 갤럭시 S24, 메이플스토리" 
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl p-4 font-bold text-lg focus:outline-none focus:border-neutral-900 transition"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-500 mb-2">불만 내용</label>
                <textarea 
                    rows="4"
                    placeholder="구체적인 내용을 적어주세요." 
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl p-4 text-base focus:outline-none focus:border-neutral-900 transition resize-none"
                />
            </div>

            {/* 📸 여기가 핵심! 사진 업로드 버튼 */}
            <div>
                <label className="block text-sm font-bold text-gray-500 mb-2">증거 사진 (선택)</label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition overflow-hidden">
                    {preview ? (
                        <img src={preview} alt="미리보기" className="h-full object-cover" />
                    ) : (
                        <div className="flex flex-col items-center text-gray-400">
                            <Camera className="w-8 h-8 mb-1" />
                            <span className="text-xs">클릭해서 사진 첨부</span>
                        </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
            </div>

            <button 
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-red-600 text-white font-black text-lg py-5 rounded-2xl hover:bg-red-700 transition shadow-lg shadow-red-200 disabled:opacity-50 mt-4"
            >
                {loading ? "등록 중..." : "🔥 화력 지원 요청하기"}
            </button>
        </div>
      </div>
    </main>
  );
}