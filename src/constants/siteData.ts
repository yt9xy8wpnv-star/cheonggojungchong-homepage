import type { ScoreForm, SignupSubjectSelections } from '../types'

export const koreanOptions = ['화법과 작문', '언어와 매체']
export const mathOptions = ['미적분', '확률과 통계', '기하']
export const inquiryOptions = [
  '생활과 윤리',
  '윤리와 사상',
  '한국지리',
  '세계지리',
  '동아시아사',
  '세계사',
  '경제',
  '정치와 법',
  '사회·문화',
  '물리학Ⅰ',
  '화학Ⅰ',
  '생명과학Ⅰ',
  '지구과학Ⅰ',
  '물리학Ⅱ',
  '화학Ⅱ',
  '생명과학Ⅱ',
  '지구과학Ⅱ',
] as const

export const studySubjectOptions = ['국어', '수학', '영어', '탐구1', '탐구2', '한국사'] as const

export const cutlineRows = [
  ['국어(화법과 작문)', '100-97', '129', '96', '96-92', '125', '91'],
  ['국어(언어와 매체)', '100-94', '129', '96', '93-88', '125', '91'],
  ['수학(확률과 통계)', '100-86', '135', '96', '87-75', '127', '88'],
  ['수학(미적분)', '100-83', '135', '96', '85-73', '127', '88'],
  ['수학(기하)', '100-84', '135', '96', '86-73', '127', '88'],
  ['경제', '39', '73', '96', '31', '65', '89'],
  ['정치와 법', '48', '69', '96', '42', '65', '90'],
  ['사회문화', '46', '66', '96', '42', '62', '88'],
  ['세계사', '50', '70', '97', '45', '66', '89'],
  ['동아시아사', '48', '69', '95', '42', '64', '90'],
  ['한국지리', '44', '70', '96', '37', '64', '89'],
  ['세계지리', '47', '67', '95', '42', '63', '89'],
  ['생활과윤리', '47', '69', '96', '41', '63', '89'],
  ['윤리와사상', '44', '70', '96', '37', '63', '89'],
  ['물리학1', '47', '69', '97', '40', '63', '88'],
  ['물리학2', '42', '74', '96', '33', '66', '89'],
  ['화학1', '48', '68', '96', '44', '65', '89'],
  ['화학2', '45', '73', '96', '34', '64', '89'],
  ['생명과학1', '43', '65', '96', '40', '63', '90'],
  ['생명과학2', '45', '76', '96', '31', '64', '89'],
  ['지구과학1', '48', '67', '96', '44', '64', '88'],
  ['지구과학2', '42', '75', '96', '30', '64', '89'],
  ['영어', '90', '-', '-', '80', '-', '-'],
  ['한국사', '40', '-', '-', '35', '-', '-'],
] as const

export const mockSchedules = [
  ['3월', '24(화)', '서울특별시교육청'],
  ['4월', '-', '-'],
  ['5월', '7(목)', '경기도교육청'],
  ['5월', '23(금)', '더프리미엄 모의고사'],
  ['6월', '4(목)', '한국교육과정평가원'],
  ['7월', '8(수)', '인천광역시교육청'],
  ['8월', '-', '-'],
  ['9월', '2(수)', '한국교육과정평가원'],
  ['10월', '20(화)', '서울특별시교육청'],
  ['11월', '19(목)', '한국교육과정평가원'],
] as const

export const achievementCards = [
  ['2027 한국 정시파이터 단체 순위', '전국 1위', '1위'],
  ['2027년 집단 평균 아이큐 순위', '국내 1위 · 아시아 8위', '아시아 8위'],
] as const

export const admissionRows = [
  ['서울대 의예과', '6명'],
  ['연세대 의예과', '8명'],
  ['울산대학교 의예과', '10명'],
  ['성균관대학교 의예과', '12명'],
  ['고려대학교 의예과', '16명'],
  ['치의예과', '16명'],
  ['약학과', '23명'],
  ['성균관대학교 반도체', '15명'],
  ['가톨릭대 의예과', '3명'],
  ['기타 의예과', '163명'],
] as const

export const serviceCards = [
  ['All About 정시', '입시 정보와 핵심 자료를 정리해 보는 서비스', '/jeongsi-info'],
  ['study with 정시', '학습 루틴과 집중 흐름을 관리하는 서비스', '/service/study-with-jeongsi'],
  ['발전기금', '청고정총의 활동을 후원하는 안내 공간', '/service/fund'],
  ['굿즈샵', '단체 굿즈와 상징 아이템을 확인하는 공간', '/service/goods'],
] as const

export const communityCards = [
  ['유튜브', '영상 콘텐츠와 활동 기록을 확인하는 채널', '/notice/community'],
  ['인스타그램', '청고정총 소식과 분위기를 보는 공간', '/notice/community'],
  ['자유게시판', '정시러들의 자유로운 소통 공간', '/notice/community'],
] as const

export const introMenu = [
  ['회장 인삿말', '/about/chairman'],
  ['단체 소개', '/about/organization'],
  ['상징 소개', '/about/symbol'],
  ['찾아 오시는 길', '/about/location'],
] as const

export const serviceMenu = [
  ['All about 정시', '/jeongsi-info'],
  ['study with 정시', '/service/study-with-jeongsi'],
  ['발전기금', '/service/fund'],
  ['굿즈샵', '/service/goods'],
  ['photo booth', '/service/photo-booth'],
] as const

export const communityMenu = [['커뮤니티', '/notice/community']] as const

export const noticeMenu = [
  ['공지사항', '/notice'],
  ['보도자료', '/notice/press'],
] as const

export const initialSignupSubjectSelections: SignupSubjectSelections = {
  korean: '화법과 작문',
  math: '미적분',
  english: '응시함',
  inquiry1: '생활과 윤리',
  inquiry2: '응시하지 않음',
  secondForeign: '응시하지 않음',
}

export const initialScoreForm: ScoreForm = {
  koreanSubject: '화법과 작문',
  mathSubject: '미적분',
  inquiry1Subject: '생활과 윤리',
  inquiry2Subject: '세계지리',
  korean: '',
  english: '',
  math: '',
  koreanHistory: '',
  inquiry1: '',
  inquiry2: '',
}
