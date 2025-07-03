import chardet
import os

file_path = os.path.join(os.path.dirname(__file__), 'data', '개역개정_통합.txt')

with open(file_path, 'rb') as f:
    raw_data = f.read()
    result = chardet.detect(raw_data)
    print(result)