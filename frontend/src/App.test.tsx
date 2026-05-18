import { render, screen } from '@testing-library/react';
import axios from 'axios';
import App from './App';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    isCancel: jest.fn(() => false),
  },
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeEach(() => {
  mockedAxios.get.mockImplementation((url: string) => {
    if (url.includes('/chapters')) {
      return Promise.resolve({ data: { book: '창세기', chapters: [1, 2] } });
    }

    return Promise.resolve({
      data: {
        version: '개역개정',
        book: '창세기',
        chapter: 1,
        verses: [{ verse: 1, text: '태초에 하나님이 천지를 창조하시니라' }],
      },
    });
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

test('renders the bible viewer shell', async () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: '성경 뷰어' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '창세기 1장' })).toBeInTheDocument();
  expect(await screen.findByText('태초에 하나님이 천지를 창조하시니라')).toBeInTheDocument();
});
