import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './App.css';

type BibleVersion = '개역개정' | '개역한글';
type Testament = 'old' | 'new';

interface BibleBook {
  name: string;
  abbr: string;
  testament: Testament;
}

interface BibleVerse {
  verse: number;
  text: string;
}

interface ChapterResponse {
  version: BibleVersion;
  book: string;
  chapter: number;
  verses?: BibleVerse[];
  error?: string;
}

interface ChaptersResponse {
  book: string;
  chapters?: number[];
  error?: string;
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL ?? 'http://127.0.0.1:8000';

const BIBLE_VERSIONS: BibleVersion[] = ['개역개정', '개역한글'];

const BIBLE_BOOKS: BibleBook[] = [
  { name: '창세기', abbr: '창', testament: 'old' },
  { name: '출애굽기', abbr: '출', testament: 'old' },
  { name: '레위기', abbr: '레', testament: 'old' },
  { name: '민수기', abbr: '민', testament: 'old' },
  { name: '신명기', abbr: '신', testament: 'old' },
  { name: '여호수아', abbr: '수', testament: 'old' },
  { name: '사사기', abbr: '삿', testament: 'old' },
  { name: '룻기', abbr: '룻', testament: 'old' },
  { name: '사무엘상', abbr: '삼상', testament: 'old' },
  { name: '사무엘하', abbr: '삼하', testament: 'old' },
  { name: '열왕기상', abbr: '왕상', testament: 'old' },
  { name: '열왕기하', abbr: '왕하', testament: 'old' },
  { name: '역대상', abbr: '대상', testament: 'old' },
  { name: '역대하', abbr: '대하', testament: 'old' },
  { name: '에스라', abbr: '스', testament: 'old' },
  { name: '느헤미야', abbr: '느', testament: 'old' },
  { name: '에스더', abbr: '에', testament: 'old' },
  { name: '욥기', abbr: '욥', testament: 'old' },
  { name: '시편', abbr: '시', testament: 'old' },
  { name: '잠언', abbr: '잠', testament: 'old' },
  { name: '전도서', abbr: '전', testament: 'old' },
  { name: '아가', abbr: '아', testament: 'old' },
  { name: '이사야', abbr: '사', testament: 'old' },
  { name: '예레미야', abbr: '렘', testament: 'old' },
  { name: '예레미야애가', abbr: '애', testament: 'old' },
  { name: '에스겔', abbr: '겔', testament: 'old' },
  { name: '다니엘', abbr: '단', testament: 'old' },
  { name: '호세아', abbr: '호', testament: 'old' },
  { name: '요엘', abbr: '욜', testament: 'old' },
  { name: '아모스', abbr: '암', testament: 'old' },
  { name: '오바댜', abbr: '옵', testament: 'old' },
  { name: '요나', abbr: '욘', testament: 'old' },
  { name: '미가', abbr: '미', testament: 'old' },
  { name: '나훔', abbr: '나', testament: 'old' },
  { name: '하박국', abbr: '합', testament: 'old' },
  { name: '스바냐', abbr: '습', testament: 'old' },
  { name: '학개', abbr: '학', testament: 'old' },
  { name: '스가랴', abbr: '슥', testament: 'old' },
  { name: '말라기', abbr: '말', testament: 'old' },
  { name: '마태복음', abbr: '마', testament: 'new' },
  { name: '마가복음', abbr: '막', testament: 'new' },
  { name: '누가복음', abbr: '눅', testament: 'new' },
  { name: '요한복음', abbr: '요', testament: 'new' },
  { name: '사도행전', abbr: '행', testament: 'new' },
  { name: '로마서', abbr: '롬', testament: 'new' },
  { name: '고린도전서', abbr: '고전', testament: 'new' },
  { name: '고린도후서', abbr: '고후', testament: 'new' },
  { name: '갈라디아서', abbr: '갈', testament: 'new' },
  { name: '에베소서', abbr: '엡', testament: 'new' },
  { name: '빌립보서', abbr: '빌', testament: 'new' },
  { name: '골로새서', abbr: '골', testament: 'new' },
  { name: '데살로니가전서', abbr: '살전', testament: 'new' },
  { name: '데살로니가후서', abbr: '살후', testament: 'new' },
  { name: '디모데전서', abbr: '딤전', testament: 'new' },
  { name: '디모데후서', abbr: '딤후', testament: 'new' },
  { name: '디도서', abbr: '딛', testament: 'new' },
  { name: '빌레몬서', abbr: '몬', testament: 'new' },
  { name: '히브리서', abbr: '히', testament: 'new' },
  { name: '야고보서', abbr: '약', testament: 'new' },
  { name: '베드로전서', abbr: '벧전', testament: 'new' },
  { name: '베드로후서', abbr: '벧후', testament: 'new' },
  { name: '요한1서', abbr: '요일', testament: 'new' },
  { name: '요한2서', abbr: '요이', testament: 'new' },
  { name: '요한3서', abbr: '요삼', testament: 'new' },
  { name: '유다서', abbr: '유', testament: 'new' },
  { name: '요한계시록', abbr: '계', testament: 'new' },
];

const encodePath = (...parts: Array<string | number>) =>
  parts.map((part) => encodeURIComponent(String(part))).join('/');

function App() {
  const [selectedBook, setSelectedBook] = useState(BIBLE_BOOKS[0].name);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>('개역개정');
  const [availableChapters, setAvailableChapters] = useState<number[]>([]);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [bookFilter, setBookFilter] = useState('');
  const [verseFilter, setVerseFilter] = useState('');
  const [fontSize, setFontSize] = useState(19);
  const [compactMode, setCompactMode] = useState(false);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [isLoadingVerses, setIsLoadingVerses] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedBookMeta = useMemo(
    () => BIBLE_BOOKS.find((book) => book.name === selectedBook) ?? BIBLE_BOOKS[0],
    [selectedBook],
  );

  const filteredBooks = useMemo(() => {
    const keyword = bookFilter.trim().toLocaleLowerCase('ko-KR');
    if (!keyword) {
      return BIBLE_BOOKS;
    }

    return BIBLE_BOOKS.filter(
      (book) =>
        book.name.toLocaleLowerCase('ko-KR').includes(keyword) ||
        book.abbr.toLocaleLowerCase('ko-KR').includes(keyword),
    );
  }, [bookFilter]);

  const filteredVerses = useMemo(() => {
    const keyword = verseFilter.trim().toLocaleLowerCase('ko-KR');
    if (!keyword) {
      return verses;
    }

    return verses.filter(
      (verse) =>
        verse.text.toLocaleLowerCase('ko-KR').includes(keyword) ||
        String(verse.verse) === keyword,
    );
  }, [verseFilter, verses]);

  const chapterIndex = availableChapters.indexOf(selectedChapter);
  const hasPreviousChapter = chapterIndex > 0;
  const hasNextChapter = chapterIndex >= 0 && chapterIndex < availableChapters.length - 1;

  useEffect(() => {
    const controller = new AbortController();

    async function loadChapters() {
      setIsLoadingChapters(true);
      setErrorMessage(null);

      try {
        const response = await axios.get<ChaptersResponse>(
          `${API_BASE_URL}/bible/${encodePath(selectedVersion, selectedBook, 'chapters')}`,
          { signal: controller.signal },
        );

        if (response.data.error || !response.data.chapters?.length) {
          throw new Error(response.data.error ?? '장 목록을 찾지 못했습니다.');
        }

        setAvailableChapters(response.data.chapters);
        setSelectedChapter((currentChapter) =>
          response.data.chapters?.includes(currentChapter) ? currentChapter : response.data.chapters?.[0] ?? 1,
        );
      } catch (error) {
        if (!axios.isCancel(error)) {
          setAvailableChapters([]);
          setVerses([]);
          setErrorMessage(error instanceof Error ? error.message : '장 목록을 불러오지 못했습니다.');
        }
      } finally {
        setIsLoadingChapters(false);
      }
    }

    loadChapters();

    return () => controller.abort();
  }, [selectedBook, selectedVersion]);

  useEffect(() => {
    if (!availableChapters.includes(selectedChapter)) {
      return;
    }

    const controller = new AbortController();

    async function loadVerses() {
      setIsLoadingVerses(true);
      setErrorMessage(null);

      try {
        const response = await axios.get<ChapterResponse>(
          `${API_BASE_URL}/bible/${encodePath(selectedVersion, selectedBook, selectedChapter)}`,
          { signal: controller.signal },
        );

        if (response.data.error || !response.data.verses) {
          throw new Error(response.data.error ?? '본문을 찾지 못했습니다.');
        }

        setVerses(response.data.verses);
      } catch (error) {
        if (!axios.isCancel(error)) {
          setVerses([]);
          setErrorMessage(error instanceof Error ? error.message : '본문을 불러오지 못했습니다.');
        }
      } finally {
        setIsLoadingVerses(false);
      }
    }

    loadVerses();

    return () => controller.abort();
  }, [availableChapters, selectedBook, selectedChapter, selectedVersion]);

  const moveChapter = (direction: -1 | 1) => {
    const nextChapter = availableChapters[chapterIndex + direction];

    if (nextChapter) {
      setSelectedChapter(nextChapter);
    }
  };

  const selectBook = (bookName: string) => {
    setSelectedBook(bookName);
    setVerseFilter('');
  };

  return (
    <main className="app-shell">
      <aside className="book-sidebar" aria-label="성경 권 선택">
        <div className="brand-block">
          <span className="brand-mark">성</span>
          <div>
            <h1>성경 뷰어</h1>
            <p>본문을 빠르게 고르고 읽는 작업 공간</p>
          </div>
        </div>

        <label className="field-label" htmlFor="book-search">
          성경 검색
        </label>
        <input
          id="book-search"
          className="text-field"
          type="search"
          value={bookFilter}
          onChange={(event) => setBookFilter(event.target.value)}
          placeholder="예: 요, 로마서"
        />

        <div className="book-list" role="list">
          {filteredBooks.map((book) => (
            <button
              className={`book-button ${selectedBook === book.name ? 'selected' : ''}`}
              key={book.name}
              onClick={() => selectBook(book.name)}
              type="button"
            >
              <span>{book.name}</span>
              <small>{book.abbr}</small>
            </button>
          ))}
        </div>
      </aside>

      <section className="viewer-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">{selectedBookMeta.testament === 'old' ? '구약' : '신약'}</p>
            <h2>
              {selectedBook} {selectedChapter}장
            </h2>
          </div>

          <div className="controls">
            <select
              aria-label="번역본"
              className="select-field"
              value={selectedVersion}
              onChange={(event) => setSelectedVersion(event.target.value as BibleVersion)}
            >
              {BIBLE_VERSIONS.map((version) => (
                <option key={version} value={version}>
                  {version}
                </option>
              ))}
            </select>

            <select
              aria-label="장"
              className="select-field chapter-select"
              disabled={isLoadingChapters || !availableChapters.length}
              value={selectedChapter}
              onChange={(event) => setSelectedChapter(Number(event.target.value))}
            >
              {availableChapters.map((chapter) => (
                <option key={chapter} value={chapter}>
                  {chapter}장
                </option>
              ))}
            </select>
          </div>
        </header>

        <div className="reader-layout">
          <article className="scripture-reader">
            <div className="reader-toolbar">
              <div className="chapter-actions">
                <button
                  className="icon-button"
                  disabled={!hasPreviousChapter}
                  onClick={() => moveChapter(-1)}
                  title="이전 장"
                  type="button"
                >
                  &lt;
                </button>
                <button
                  className="icon-button"
                  disabled={!hasNextChapter}
                  onClick={() => moveChapter(1)}
                  title="다음 장"
                  type="button"
                >
                  &gt;
                </button>
              </div>

              <label className="search-box">
                <span>본문 검색</span>
                <input
                  type="search"
                  value={verseFilter}
                  onChange={(event) => setVerseFilter(event.target.value)}
                  placeholder="절 번호 또는 단어"
                />
              </label>
            </div>

            {errorMessage && <div className="state-banner error">{errorMessage}</div>}

            {(isLoadingChapters || isLoadingVerses) && (
              <div className="state-banner">본문을 불러오는 중입니다.</div>
            )}

            {!isLoadingVerses && !errorMessage && filteredVerses.length === 0 && (
              <div className="empty-state">검색 결과가 없습니다.</div>
            )}

            <div
              className={`verse-list ${compactMode ? 'compact' : ''}`}
              style={{ '--reader-font-size': `${fontSize}px` } as React.CSSProperties}
            >
              {filteredVerses.map((verse) => (
                <p className="verse-row" key={verse.verse}>
                  <span className="verse-number">{verse.verse}</span>
                  <span>{verse.text}</span>
                </p>
              ))}
            </div>
          </article>

          <aside className="settings-panel" aria-label="읽기 설정">
            <div className="stat-grid">
              <div>
                <strong>{availableChapters.length || '-'}</strong>
                <span>장</span>
              </div>
              <div>
                <strong>{verses.length || '-'}</strong>
                <span>절</span>
              </div>
            </div>

            <label className="field-label" htmlFor="font-size">
              글자 크기
            </label>
            <input
              id="font-size"
              className="range-field"
              max="24"
              min="16"
              type="range"
              value={fontSize}
              onChange={(event) => setFontSize(Number(event.target.value))}
            />

            <label className="toggle-row">
              <input
                checked={compactMode}
                onChange={(event) => setCompactMode(event.target.checked)}
                type="checkbox"
              />
              <span>촘촘하게 보기</span>
            </label>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default App;
