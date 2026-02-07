from fastapi import FastAPI, Request, UploadFile, File, Form
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import re
import uuid
import os

app = FastAPI()

# CORS 설정 (프론트엔드에서 요청 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# [중요] Supabase 설정
# Vercel 배포 시에는 'Settings' -> 'Environment Variables'에 키를 등록하는 것이 안전합니다.
# ==========================================

# 1. 환경변수에서 가져오기 (추천 방식)
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# 2. (환경변수가 없을 때를 대비한 비상용 하드코딩 - 배포 후엔 지우는 게 좋습니다)
if not SUPABASE_URL:
    SUPABASE_URL = "https://sjdsnkwxpbhrddtmikza.supabase.co"
if not SUPABASE_KEY:
    SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqZHNua3d4cGJocmRkdG1pa3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTI5NjEsImV4cCI6MjA4NTIyODk2MX0.wQgyUPAI_eDIye-umVryhxk2LOe3QyQZiUgWYVcDyR0"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 데이터 모델 정의
class Vote(BaseModel):
    complaint_id: int

class CommentModel(BaseModel):
    complaint_id: int
    content: str

# 비속어 필터링 및 전화번호 마스킹 함수
def clean_text(text: str) -> str:
    if not text: return ""
    bad_words = ["시발", "씨발", "병신", "개새끼", "지랄", "fuck", "shit", "미친", "죽어"]
    for word in bad_words:
        text = text.replace(word, "🤬") 
    phone_pattern = r'01[016789][-\s]?[0-9]{3,4}[-\s]?[0-9]{4}'
    text = re.sub(phone_pattern, "010-****-****", text)
    return text

# 🔥 [수정됨] 불만 등록 API
@app.post("/api/report")
async def create_complaint(
    brand: str = Form(...),
    product: str = Form(...),
    issue: str = Form(...),
    image: UploadFile = File(None) # 이미지는 선택 사항
):
    clean_brand = clean_text(brand)
    clean_product = clean_text(product)
    clean_issue = clean_text(issue)
    
    image_url = None

    # 이미지가 있다면 Supabase Storage 'uploads' 버킷에 업로드
    if image:
        try:
            file_content = await image.read()
            file_ext = image.filename.split(".")[-1]
            file_name = f"{uuid.uuid4()}.{file_ext}" # 파일명 중복 방지
            
            # 1. 파일 업로드
            supabase.storage.from_("uploads").upload(
                path=file_name, 
                file=file_content, 
                file_options={"content-type": image.content_type}
            )
            
            # 2. 공개 URL 가져오기 (최신 방식)
            image_url = supabase.storage.from_("uploads").get_public_url(file_name)
                
        except Exception as e:
            print(f"⚠️ 이미지 업로드 중 오류 발생: {e}")
            # 이미지가 실패해도 글은 올라가도록 pass 처리 (필요시 return error 가능)

    try:
        # DB에 저장
        response = supabase.table("complaints").insert({
            "brand": clean_brand,
            "product": clean_product,
            "issue": clean_issue,
            "image_url": image_url, # 이미지 URL (없으면 null)
            "count": 1 
        }).execute()
        
        return {"message": "저장 성공", "data": response.data}
        
    except Exception as e:
        print(f"❌ DB 저장 실패: {e}")
        return {"message": "저장 실패", "error": str(e)}

# --- 기존 기능 유지 ---

@app.post("/api/vote")
def vote_complaint(data: Vote, request: Request):
    client_ip = request.headers.get('x-forwarded-for')
    if not client_ip: client_ip = request.client.host
    try:
        check = supabase.table("votes").select("*").eq("complaint_id", data.complaint_id).eq("ip_address", client_ip).execute()
        if check.data: return {"message": "ALREADY_VOTED"}
        
        supabase.table("votes").insert({"complaint_id": data.complaint_id, "ip_address": client_ip}).execute()
        
        # 현재 count 가져와서 +1 업데이트
        current_data = supabase.table("complaints").select("count").eq("id", data.complaint_id).execute()
        if current_data.data:
            current_count = current_data.data[0]['count']
            supabase.table("complaints").update({"count": current_count + 1}).eq("id", data.complaint_id).execute()
            
        return {"message": "SUCCESS"}
    except Exception as e:
        return {"message": "ERROR", "error": str(e)}

@app.get("/api/complaints")
def get_complaints():
    try:
        # 최신순 정렬 등을 원하면 .order("created_at", desc=True) 추가 가능
        response = supabase.table("complaints").select("*").order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        return []

@app.post("/api/comments")
def add_comment(data: CommentModel):
    clean_content = clean_text(data.content)
    try:
        supabase.table("comments").insert({"complaint_id": data.complaint_id, "content": clean_content}).execute()
        return {"message": "SUCCESS"}
    except Exception as e:
        return {"message": "ERROR", "error": str(e)}

@app.get("/api/comments/{complaint_id}")
def get_comments(complaint_id: int):
    try:
        response = supabase.table("comments").select("*").eq("complaint_id", complaint_id).order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        return []

@app.delete("/api/complaints/{complaint_id}")
def delete_complaint(complaint_id: int, password: str):
    ADMIN_PASSWORD = "vent1234"
    if password != ADMIN_PASSWORD: return {"message": "WRONG_PASSWORD"}
    try:
        # 외래키 제약조건 때문에 자식 데이터(댓글, 투표) 먼저 삭제
        supabase.table("comments").delete().eq("complaint_id", complaint_id).execute()
        supabase.table("votes").delete().eq("complaint_id", complaint_id).execute()
        supabase.table("complaints").delete().eq("id", complaint_id).execute()
        return {"message": "SUCCESS"}
    except Exception as e:
        return {"message": "ERROR", "error": str(e)}