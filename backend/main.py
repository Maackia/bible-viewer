from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import re

app = FastAPI()

# CORS 미들웨어 설정
origins = [
    "http://localhost",
    "http://localhost:3000",  # React 앱의 기본 주소
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 번역본과 통합 파일 매핑
version_file_map = {
    "개역한글": "개역한글_통합.txt",
    "개역개정": "개역개정_통합.txt",
}

# 성경 약어 매핑 (이전과 동일)
bible_abbr_map = {
    "창세기": "창", "출애굽기": "출", "레위기": "레", "민수기": "민", "신명기": "신",
    "여호수아": "수", "사사기": "삿", "룻기": "룻", "사무엘상": "삼상", "사무엘하": "삼하",
    "열왕기상": "왕상", "열왕기하": "왕하", "역대상": "대상", "역대하": "대하", "에스라": "스",
    "느헤미야": "느", "에스더": "에", "욥기": "욥", "시편": "시", "잠언": "잠",
    "전도서": "전", "아가": "아", "이사야": "사", "예레미야": "렘", "예레미야애가": "애",
    "에스겔": "겔", "다니엘": "단", "호세아": "호", "요엘": "욜", "아모스": "암",
    "오바댜": "옵", "요나": "욘", "미가": "미", "나훔": "나", "하박국": "합",
    "스바냐": "습", "학개": "학", "스가랴": "슥", "말라기": "말", "마태복음": "마",
    "마가복음": "막", "누가복음": "눅", "요한복음": "요", "사도행전": "행", "로마서": "롬",
    "고린도전서": "고전", "고린도후서": "고후", "갈라디아서": "갈", "에베소서": "엡", "빌립보서": "빌",
    "골로새서": "골", "데살로니가전서": "살전", "데살로니가후서": "살후", "디모데전서": "딤전", "디모데후서": "딤후",
    "디도서": "딛", "빌레몬서": "몬", "히브리서": "히", "야고보서": "약", "베드로전서": "벧전",
    "베드로후서": "벧후", "요한1서": "요일", "요한2서": "요이", "요한3서": "요삼", "유다서": "유",
    "요한계시록": "계"
}

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/bible/{version}/{book}/{chapter}")
def get_bible_chapter(
    version: str,
    book: str,
    chapter: int
):
    file_name = version_file_map.get(version)
    if not file_name:
        return {"error": f"Unsupported bible version: {version}"}

    file_path = os.path.join(os.path.dirname(__file__), "data", file_name)

    try:
        with open(file_path, 'r', encoding='cp949') as f: # 인코딩 CP949 사용
            content = f.read()

        book_abbr = bible_abbr_map.get(book)
        if not book_abbr:
            return {"error": f"Bible book abbreviation not found for: {book}"}

        verses_in_chapter = []
        # 해당 장의 모든 절을 파싱하는 정규식
        # 예: 창1:1 ... 창1:2 ...
        # 다음 절의 시작 또는 다음 장의 시작 또는 파일 끝까지
        # 정규식: [성경약어][장]:(\d+) (.*?)(?={book_abbr}\d+:\d+|{book_abbr}\d+|$)
        # {book_abbr}\d+:\d+ 는 다음 절 마커, {book_abbr}\d+ 는 다음 장 마커 (예: 창2:1), $는 파일 끝
        # \s*는 공백 문자를 0개 이상 허용
        pattern = re.compile(rf"{book_abbr}{chapter}:(\d+)\s*(.*?)(?={book_abbr}\d+:\d+|{book_abbr}\d+|$)", re.DOTALL)
        
        for match in pattern.finditer(content):
            verse_num = int(match.group(1))
            verse_text = match.group(2).strip()
            verses_in_chapter.append({"verse": verse_num, "text": verse_text})

        if verses_in_chapter:
            return {"version": version, "book": book, "chapter": chapter, "verses": verses_in_chapter}
        else:
            return {"error": "Chapter or verses not found"}

    except FileNotFoundError:
        return {"error": f"Bible file not found: {file_name}"}
    except Exception as e:
        return {"error": f"Error reading bible data: {e}"}


@app.get("/bible/{version}/{book}/chapters") # version 파라미터 추가
def get_book_chapters(
    version: str,
    book: str
):
    file_name = version_file_map.get(version)
    if not file_name:
        return {"error": f"Unsupported bible version: {version}"}

    file_path = os.path.join(os.path.dirname(__file__), "data", file_name)

    try:
        with open(file_path, 'r', encoding='cp949') as f:
            content = f.read()

        book_abbr = bible_abbr_map.get(book)
        if not book_abbr:
            return {"error": f"Bible book abbreviation not found for: {book}"}

        chapter_numbers = set()
        # 정규식: [성경약어](\d+):\d+
        chapter_pattern = re.compile(rf"{book_abbr}(\d+):\d+")
        for match in chapter_pattern.finditer(content):
            chapter_numbers.add(int(match.group(1)))
        
        sorted_chapters = sorted(list(chapter_numbers))
        return {"book": book, "chapters": sorted_chapters}

    except FileNotFoundError:
        return {"error": f"Bible file not found: {file_name}"}
    except Exception as e:
        return {"error": f"Error reading chapter data: {e}"}