# backend/main.py (Supabase 버전)

from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import os
from datetime import datetime

app = FastAPI()

# 1. 보안 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 배포를 위해 모든 곳에서 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Supabase 연결 설정 (여기에 아까 복사한 값을 넣으세요!)
url: str = "https://sjdsnkwxpbhrddtmikza.supabase.co"
key: str = "sb_publishable_tWA8ynGOhj5dXb_MwB3SIg_VsC8xC9N"

supabase: Client = create_client(url, key)

class Complaint(BaseModel):
    brand: str
    product: str
    issue: str

# 3. 불만 접수 (POST) -> Supabase에 저장
@app.post("/api/report")
def create_complaint(data: Complaint):
    print(f"🔥 데이터 수신: {data.brand} - {data.product}")
    
    # Supabase에 데이터 쏘기
    try:
        response = supabase.table("complaints").insert({
            "brand": data.brand,
            "product": data.product,
            "issue": data.issue
        }).execute()
        print("✅ Supabase 저장 성공!")
        return {"message": "저장 성공", "data": response.data}
    except Exception as e:
        print(f"❌ 저장 실패: {e}")
        return {"message": "저장 실패", "error": str(e)}

# 4. 불만 조회 (GET) -> Supabase에서 가져오기
@app.get("/api/complaints")
def get_complaints():
    try:
        # 모든 데이터 가져오기
        response = supabase.table("complaints").select("*").execute()
        return response.data
    except Exception as e:
        print(f"❌ 조회 실패: {e}")
        return []