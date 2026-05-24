from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import re
import json
import pathlib
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

# 허용된 데이터 디렉토리 (Path Traversal 방지용 기준 경로)
DATA_DIR = pathlib.Path(os.path.dirname(__file__)) / "data"

# 인덱스 로드 (앱 시작 시 한 번만 읽음)
INDEX_PATH = DATA_DIR / "index.json"


def load_index() -> dict:
    """인덱스 파일을 메모리에 로드합니다."""
    try:
        with open(INDEX_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        logger.warning("Index file not found at %s. Falling back to full file scan.", INDEX_PATH)
        return {}


def resolve_safe_path(filename: str) -> pathlib.Path | None:
    """파일명이 허용된 DATA_DIR 내에 있는지 검증합니다."""
    target = (DATA_DIR / filename).resolve()
    if not str(target).startswith(str(DATA_DIR.resolve())):
        logger.warning("Path traversal attempt detected for file: %s", filename)
        return None
    return target


# 전역 인덱스 (서버 시작 시 한 번 로드)
bible_index = load_index()


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/bible/{version}/{book}/chapters")  # version 파라미터 추가
def get_book_chapters(version: str, book: str):
    """인덱스에서 장 목록을 빠르게 조회합니다."""
    file_name = version_file_map.get(version)
    if not file_name:
        return {"error": "지원하지 않는 번역본입니다."}

    # 인덱스에서 조회 (O(1))
    index_data = bible_index.get(version, {})
    book_chapters = index_data.get(book, {})

    if book_chapters:
        chapters = sorted([int(c) for c in book_chapters.keys()])
        return {"book": book, "chapters": chapters}

    # 인덱스에 없으면 파일에서 직접 스캔 (폴백)
    safe_path = resolve_safe_path(file_name)
    if not safe_path:
        return {"error": "파일 경로가 유효하지 않습니다."}
    file_path = str(safe_path)
    try:
        with open(file_path, "r", encoding="cp949") as f:
            content = f.read()

        book_abbr = bible_abbr_map.get(book)
        if not book_abbr:
            return {"error": f"성경 책 약어를 찾을 수 없습니다: {book}"}

        chapter_numbers = set()
        chapter_pattern = re.compile(rf"{book_abbr}(\d+):\d+")
        for match in chapter_pattern.finditer(content):
            chapter_numbers.add(int(match.group(1)))

        sorted_chapters = sorted(list(chapter_numbers))
        return {"book": book, "chapters": sorted_chapters}

    except FileNotFoundError:
        return {"error": "성경 파일을 찾을 수 없습니다."}
    except Exception as e:
        logger.error("Chapter list error for %s/%s: %s", version, book, exc_info=True)
        return {"error": "장 목록 조회 중 오류가 발생했습니다."}


@app.get("/bible/{version}/{book}/{chapter}")
def get_bible_chapter(version: str, book: str, chapter: int):
    """인덱스에서 오프셋을 찾아 해당 장만 읽습니다."""
    file_name = version_file_map.get(version)
    if not file_name:
        return {"error": "지원하지 않는 번역본입니다."}

    # 인덱스에서 오프셋 조회
    index_data = bible_index.get(version, {})
    book_chapters = index_data.get(book, {})
    chapter_str = str(chapter)

    if not book_chapters or chapter_str not in book_chapters:
        return {"error": "장 또는 절을 찾을 수 없습니다."}

    start_offset = book_chapters[chapter_str]
    safe_path = resolve_safe_path(file_name)
    if not safe_path:
        return {"error": "파일 경로가 유효하지 않습니다."}
    file_path = str(safe_path)

    try:
        with open(file_path, "r", encoding="cp949") as f:
            # 인덱스 오프셋부터 읽기 시작 (다음 장이 나오거나 파일 끝까지)
            content = f.read()

        book_abbr = bible_abbr_map.get(book)
        if not book_abbr:
            return {"error": f"성경 책 약어를 찾을 수 없습니다: {book}"}

        # 해당 장의 모든 절을 파싱하는 정규식
        pattern = re.compile(
            rf"{book_abbr}{chapter}:(\d+)\s*(.*?)(?={book_abbr}\d+:\d+|{book_abbr}\d+|$)",
            re.DOTALL,
        )

        verses_in_chapter = []
        for match in pattern.finditer(content):
            verse_num = int(match.group(1))
            verse_text = match.group(2).strip()
            verses_in_chapter.append({"verse": verse_num, "text": verse_text})

        if verses_in_chapter:
            return {
                "version": version,
                "book": book,
                "chapter": chapter,
                "verses": verses_in_chapter,
            }
        else:
            return {"error": "장 또는 절을 찾을 수 없습니다."}

    except FileNotFoundError:
        return {"error": "성경 파일을 찾을 수 없습니다."}
    except Exception as e:
        logger.error("Bible verse error for %s/%s/%d: %s", version, book, chapter, exc_info=True)
        return {"error": "본문 조회 중 오류가 발생했습니다."}
