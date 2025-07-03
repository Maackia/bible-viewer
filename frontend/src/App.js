import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Nav, Navbar, NavDropdown, ListGroup, Form } from 'react-bootstrap';

function App() {
  const [bibleText, setBibleText] = useState([]); // 여러 절을 담을 배열로 변경
  const [selectedBook, setSelectedBook] = useState('창세기');
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [selectedVersion, setSelectedVersion] = useState('개역한글');
  const [availableChapters, setAvailableChapters] = useState([]); // 동적으로 장 목록을 저장

  // 성경 구절 가져오기
  useEffect(() => {
    axios.get(`http://127.0.0.1:8000/bible/${selectedVersion}/${selectedBook}/${selectedChapter}`)
      .then(response => {
        if (response.data.verses) {
          setBibleText(response.data.verses);
        } else {
          setBibleText([]);
          console.error('No verses found in response:', response.data);
        }
      })
      .catch(error => {
        console.error('Error fetching bible text:', error);
        setBibleText([]);
      });
  }, [selectedBook, selectedChapter, selectedVersion]);

  // 선택된 성경과 번역본에 따라 장 목록 가져오기
  useEffect(() => {
    axios.get(`http://127.0.0.1:8000/bible/${selectedVersion}/${selectedBook}/chapters`)
      .then(response => {
        if (response.data.chapters) {
          setAvailableChapters(response.data.chapters);
          setSelectedChapter(1); // 새로운 성경 선택 시 1장으로 초기화
        } else {
          setAvailableChapters([]);
          console.error('No chapters found for book:', response.data);
        }
      })
      .catch(error => {
        console.error('Error fetching chapters:', error);
        setAvailableChapters([]);
      });
  }, [selectedBook, selectedVersion]);

  const bibleBooks = [
    '창세기', '출애굽기', '레위기', '민수기', '신명기', '여호수아', '사사기', '룻기', '사무엘상', '사무엘하',
    '열왕기상', '열왕기하', '역대상', '역대하', '에스라', '느헤미야', '에스더', '욥기', '시편', '잠언',
    '전도서', '아가', '이사야', '예레미야', '예레미야애가', '에스겔', '다니엘', '호세아', '요엘', '아모스',
    '오바댜', '요나', '미가', '나훔', '하박국', '스바냐', '학개', '스가랴', '말라기', '마태복음', '마가복음',
    '누가복음', '요한복음', '사도행전', '로마서', '고린도전서', '고린도후서', '갈라디아서', '에베소서', '빌립보서',
    '골로새서', '데살로니가전서', '데살로니가후서', '디모데전서', '디모데후서', '디도서', '빌레몬서', '히브리서',
    '야고보서', '베드로전서', '베드로후서', '요한1서', '요한2서', '요한3서', '유다서', '요한계시록'
  ];

  return (
    <div className="d-flex">
      <Nav className="flex-column bg-light vh-100 p-3" style={{ width: '250px', overflowY: 'auto' }}>
        <ListGroup>
          {bibleBooks.map(book => (
            <ListGroup.Item
              key={book}
              action
              onClick={() => setSelectedBook(book)}
              active={selectedBook === book}
            >
              {book}
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Nav>

      <Container fluid className="p-0">
        <Navbar bg="light" expand="lg" className="mb-3">
          <Container fluid>
            <Navbar.Brand href="#home">통합 성경 뷰어</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="me-auto">
                <NavDropdown title={`번역본: ${selectedVersion}`} id="basic-nav-dropdown" onSelect={(eventKey) => setSelectedVersion(eventKey)}>
                  <NavDropdown.Item eventKey="개역개정">개역개정</NavDropdown.Item>
                  <NavDropdown.Item eventKey="개역한글">개역한글</NavDropdown.Item>
                  <NavDropdown.Item eventKey="새번역">새번역</NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item eventKey="히브리어">히브리어 (원서)</NavDropdown.Item>
                </NavDropdown>
                <Form.Select
                  className="ms-3"
                  style={{ width: '100px' }}
                  value={selectedChapter}
                  onChange={(e) => setSelectedChapter(parseInt(e.target.value))}
                >
                  {availableChapters.map(chapter => (
                    <option key={chapter} value={chapter}>{chapter}장</option>
                  ))}
                </Form.Select>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
        <Row className="mt-3">
          <Col>
            <h4>{selectedBook} {selectedChapter}장 ({selectedVersion})</h4>
            {bibleText.map(verse => (
              <p key={verse.verse}><strong>{verse.verse}.</strong> {verse.text}</p>
            ))}
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default App;

