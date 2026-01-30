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

# ★ 여기에 사장님의 진짜 Supabase 키(eyJ...)를 넣어주세요!
url: str = "https://sjdsnkwxpbhrddtmikza.supabase.co" 
key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqZHNua3d4cGJocmRkdG1pa3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTI5NjEsImV4cCI6MjA4NTIyODk2MX0.wQgyUPAI_eDIye-umVryhxk2LOe3QyQZiUgWYVcDyR0" 

supabase: Client = create_client(url, key)

class Complaint(BaseModel):
    brand: str
    product: str
    issue: str

class Vote(BaseModel):
    complaint_id: int

class CommentModel(BaseModel):
    complaint_id: int
    content: str

def clean_text(text: str) -> str:
    if not text: return ""
    bad_words = ["시발", "씨발", "병신", "개새끼", "지랄", "fuck", "shit", "미친", "죽어"]
    for word in bad_words:
        text = text.replace(word, "🤬") 
    phone_pattern = r'01[016789][-\s]?[0-9]{3,4}[-\s]?[0-9]{4}'
    text = re.sub(phone_pattern, "010-****-****", text)
    return text

# 1. 불만 등록
@app.post("/api/report")
def create_complaint(data: Complaint):
    clean_brand = clean_text(data.brand)
    clean_product = clean_text(data.product)
    clean_issue = clean_text(data.issue)
    try:
        response = supabase.table("complaints").insert({
            "brand": clean_brand, "product": clean_product, "issue": clean_issue, "count": 1 
        }).execute()
        return {"message": "저장 성공", "data": response.data}
    except Exception as e:
        return {"message": "저장 실패", "error": str(e)}

# 2. 공감 투표
@app.post("/api/vote")
def vote_complaint(data: Vote, request: Request):
    client_ip = request.headers.get('x-forwarded-for')
    if not client_ip: client_ip = request.client.host
    try:
        check = supabase.table("votes").select("*").eq("complaint_id", data.complaint_id).eq("ip_address", client_ip).execute()
        if check.data: return {"message": "ALREADY_VOTED"}
        
        supabase.table("votes").insert({"complaint_id": data.complaint_id, "ip_address": client_ip}).execute()
        
        current_data = supabase.table("complaints").select("count").eq("id", data.complaint_id).execute()
        current_count = current_data.data[0]['count']
        supabase.table("complaints").update({"count": current_count + 1}).eq("id", data.complaint_id).execute()
        return {"message": "SUCCESS"}
    except Exception as e:
        return {"message": "ERROR", "error": str(e)}

# 3. 목록 조회
@app.get("/api/complaints")
def get_complaints():
    try:
        response = supabase.table("complaints").select("*").execute()
        return response.data
    except Exception as e:
        return []

# 🔥 [NEW] 4. 댓글 쓰기
@app.post("/api/comments")
def add_comment(data: CommentModel):
    clean_content = clean_text(data.content) # 댓글도 욕설 필터링
    try:
        supabase.table("comments").insert({
            "complaint_id": data.complaint_id,
            "content": clean_content
        }).execute()
        return {"message": "SUCCESS"}
    except Exception as e:
        print(f"댓글 에러: {e}")
        return {"message": "ERROR", "error": str(e)}

# 🔥 [NEW] 5. 댓글 불러오기
@app.get("/api/comments/{complaint_id}")
def get_comments(complaint_id: int):
    try:
        # 최신순으로 정렬해서 가져오기
        response = supabase.table("comments").select("*").eq("complaint_id", complaint_id).order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        return []
    # ... (위쪽 코드는 그대로 두세요) ...

# 🔥 [NEW] 6. 관리자 삭제 기능 (비밀번호: vent1234)
@app.delete("/api/complaints/{complaint_id}")
def delete_complaint(complaint_id: int, password: str):
    # ★ 사장님만의 비밀번호 설정 (원하는 걸로 바꾸셔도 됩니다)
    ADMIN_PASSWORD = "vent1234"

    if password != ADMIN_PASSWORD:
        return {"message": "WRONG_PASSWORD"}

    try:
        # 1. 관련된 댓글과 투표 먼저 깔끔하게 지우기 (청소)
        supabase.table("comments").delete().eq("complaint_id", complaint_id).execute()
        supabase.table("votes").delete().eq("complaint_id", complaint_id).execute()

        # 2. 진짜 불만 글 삭제
        supabase.table("complaints").delete().eq("id", complaint_id).execute()

        return {"message": "SUCCESS"}
    except Exception as e:
        print(f"삭제 에러: {e}")
        return {"message": "ERROR", "error": str(e)}