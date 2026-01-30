from fastapi import FastAPI, Request, UploadFile, File, Form
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import re
import uuid

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ★ 사장님의 진짜 키를 넣어주세요!
url: str = "https://sjdsnkwxpbhrddtmikza.supabase.co"
key: str = "여기에_진짜_KEY_넣기"

supabase: Client = create_client(url, key)

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

# 🔥 [수정됨] 불만 등록 (사진 파일 받기 위해 구조 변경)
@app.post("/api/report")
async def create_complaint(
    brand: str = Form(...),
    product: str = Form(...),
    issue: str = Form(...),
    image: UploadFile = File(None) # 사진은 없을 수도 있음
):
    clean_brand = clean_text(brand)
    clean_product = clean_text(product)
    clean_issue = clean_text(issue)
    
    image_url = None

    # 사진이 있다면 Supabase Storage에 업로드
    if image:
        try:
            file_content = await image.read()
            file_ext = image.filename.split(".")[-1]
            file_name = f"{uuid.uuid4()}.{file_ext}" # 파일명 겹치지 않게 랜덤 생성
            
            # 'uploads' 버킷에 저장
            supabase.storage.from_("uploads").upload(file_name, file_content, {"content-type": image.content_type})
            
            # 저장된 이미지의 공개 주소 가져오기
            public_url_data = supabase.storage.from_("uploads").get_public_url(file_name)
            
            # get_public_url이 문자열을 반환하는지 객체를 반환하는지 버전에 따라 다를 수 있음
            # 보통 문자열(URL)을 바로 반환하거나, data 속성 안에 있거나 함.
            # 최신 supabase-py에서는 바로 URL 문자열을 반환하는 경우가 많음.
            if isinstance(public_url_data, str):
                image_url = public_url_data
            else:
                # 구버전 대응
                image_url = public_url_data  # 일단 넣어봄
                
        except Exception as e:
            print(f"이미지 업로드 실패: {e}")

    try:
        response = supabase.table("complaints").insert({
            "brand": clean_brand,
            "product": clean_product,
            "issue": clean_issue,
            "image_url": image_url, # 이미지 주소도 같이 저장
            "count": 1 
        }).execute()
        return {"message": "저장 성공", "data": response.data}
    except Exception as e:
        print(f"DB 저장 실패: {e}")
        return {"message": "저장 실패", "error": str(e)}

# 나머지 기능들은 그대로 유지
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

@app.get("/api/complaints")
def get_complaints():
    try:
        response = supabase.table("complaints").select("*").execute()
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
        supabase.table("comments").delete().eq("complaint_id", complaint_id).execute()
        supabase.table("votes").delete().eq("complaint_id", complaint_id).execute()
        supabase.table("complaints").delete().eq("id", complaint_id).execute()
        return {"message": "SUCCESS"}
    except Exception as e:
        return {"message": "ERROR", "error": str(e)}