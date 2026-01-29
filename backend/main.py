from fastapi import FastAPI, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ★ 여기에 사장님의 Supabase 키를 넣어주세요!
url: str = "https://sjdsnkwxpbhrddtmikza.supabase.co"
key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqZHNua3d4cGJocmRkdG1pa3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTI5NjEsImV4cCI6MjA4NTIyODk2MX0.wQgyUPAI_eDIye-umVryhxk2LOe3QyQZiUgWYVcDyR0"

supabase: Client = create_client(url, key)

class Complaint(BaseModel):
    brand: str
    product: str
    issue: str

class Vote(BaseModel):
    complaint_id: int

def clean_text(text: str) -> str:
    if not text: return ""
    bad_words = ["시발", "씨발", "병신", "개새끼", "지랄", "fuck", "shit", "미친", "죽어"]
    for word in bad_words:
        text = text.replace(word, "🤬") 
    phone_pattern = r'01[016789][-\s]?[0-9]{3,4}[-\s]?[0-9]{4}'
    text = re.sub(phone_pattern, "010-****-****", text)
    return text

# 불만 등록
@app.post("/api/report")
def create_complaint(data: Complaint):
    clean_brand = clean_text(data.brand)
    clean_product = clean_text(data.product)
    clean_issue = clean_text(data.issue)
    
    try:
        # 처음 등록할 때 count는 1로 시작
        response = supabase.table("complaints").insert({
            "brand": clean_brand,
            "product": clean_product,
            "issue": clean_issue,
            "count": 1 
        }).execute()
        return {"message": "저장 성공", "data": response.data}
    except Exception as e:
        print(f"❌ 저장 실패: {e}")
        return {"message": "저장 실패", "error": str(e)}

# 🔥 [추가된 기능] 공감 투표 (IP 체크)
@app.post("/api/vote")
def vote_complaint(data: Vote, request: Request):
    # 1. 사용자 IP 가져오기 (Render 같은 서버 뒤에 있을 때를 대비해 x-forwarded-for 확인)
    client_ip = request.headers.get('x-forwarded-for')
    if not client_ip:
        client_ip = request.client.host
    
    print(f"🔥 투표 시도: ID {data.complaint_id} / IP {client_ip}")

    try:
        # 2. 이미 투표했는지 장부(votes) 뒤져보기
        check = supabase.table("votes").select("*").eq("complaint_id", data.complaint_id).eq("ip_address", client_ip).execute()
        
        if check.data:
            # 이미 기록이 있으면 거절!
            return {"message": "ALREADY_VOTED"}

        # 3. 투표 안 했으면 -> 장부에 기록하고, 카운트 +1
        # (1) 기록 남기기
        supabase.table("votes").insert({
            "complaint_id": data.complaint_id,
            "ip_address": client_ip
        }).execute()

        # (2) 카운트 증가시키기 (기존 글 불러와서 +1 업데이트)
        # 현재 카운트 가져오기
        current_data = supabase.table("complaints").select("count").eq("id", data.complaint_id).execute()
        current_count = current_data.data[0]['count']
        
        # +1 해서 업데이트
        supabase.table("complaints").update({"count": current_count + 1}).eq("id", data.complaint_id).execute()

        return {"message": "SUCCESS"}

    except Exception as e:
        print(f"❌ 투표 에러: {e}")
        return {"message": "ERROR", "error": str(e)}

@app.get("/api/complaints")
def get_complaints():
    try:
        response = supabase.table("complaints").select("*").execute()
        return response.data
    except Exception as e:
        print(f"❌ 조회 실패: {e}")
        return []