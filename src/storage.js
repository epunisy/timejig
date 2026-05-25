// localStorage에 앱 데이터 저장 / 불러오기

const STORAGE_KEY = 'timejig_data_v1';

// 데이터 저장
export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('저장 실패:', e);
  }
}

// 데이터 불러오기
export function loadData() {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return null;
    return JSON.parse(json);
  } catch (e) {
    console.error('불러오기 실패:', e);
    return null;
  }
}

// 데이터 다 지우기 (필요할 때)
export function clearData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('삭제 실패:', e);
  }
}