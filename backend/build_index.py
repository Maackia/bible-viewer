"""성경 데이터 파일에서 장별 오프셋 인덱스를 생성합니다."""

import json
import os
import re

DATA_DIR = os.path.dirname(__file__)
VERSIONS = {
    "개역개정": "개역개정_통합.txt",
    "개역한글": "개역한글_통합.txt",
}


def build_index(version: str, filename: str) -> dict:
    """버전별 성경 파일에서 장 오프셋 인덱스를 생성합니다."""
    file_path = os.path.join(DATA_DIR, "data", filename)

    # 데이터 파일은 CP949 인코딩
    with open(file_path, "r", encoding="cp949") as f:
        content = f.read()

    # 모든 장 마커({약어}{장}:1)의 위치를 찾음
    chapter_pattern = re.compile(r"([가-힣]+)(\d+):1")
    chapters = {}  # {book: {chapter_str: offset}}

    for match in chapter_pattern.finditer(content):
        book = match.group(1)
        chapter = match.group(2)

        if book not in chapters:
            chapters[book] = {}

        # 중복된 책/장 이름이 있으면 첫 번째 오프셋만 사용
        if chapter not in chapters[book]:
            chapters[book][chapter] = match.start()

    return chapters


def main():
    index = {}

    for version, filename in VERSIONS.items():
        print(f"Building index for {version} ({filename})...")
        index[version] = build_index(version, filename)

    output_path = os.path.join(DATA_DIR, "data", "index.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

    print(f"Index saved to {output_path}")


if __name__ == "__main__":
    main()
