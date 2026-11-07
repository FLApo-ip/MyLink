/**
 * 최초 접속 시(저장소가 아직 초기화되지 않은 상태)에만 로드되는
 * 명시적 초기 시드 데이터(Seed Data) 정의 모듈입니다.
 * 비즈니스 로직과 엄격히 분리되어 관리됩니다.
 */
export const INITIAL_PROFILE_SEED = Object.freeze({
    name: '김민수 (Minsu Kim)',
    bio: '풀스택 크리에이터 & 프론트엔드 개발자 | 나만의 채널과 프로젝트를 한곳에서 만나보세요!',
    avatar: '🚀',
    username: 'minsu-creator'
});

export const INITIAL_LINKS_SEED = Object.freeze([
    Object.freeze({
        id: 'seed-link-1',
        title: 'GitHub 공식 포트폴리오 & 오픈소스',
        url: 'https://github.com',
        icon: '💻',
        order: 0,
        clicks: 12,
        createdAt: 1730990000000
    }),
    Object.freeze({
        id: 'seed-link-2',
        title: '기술 블로그 & 개발 아티클 모음',
        url: 'https://velog.io',
        icon: '📝',
        order: 1,
        clicks: 8,
        createdAt: 1730990100000
    }),
    Object.freeze({
        id: 'seed-link-3',
        title: '유튜브 크리에이터 채널 구독하기',
        url: 'https://www.youtube.com',
        icon: '🎬',
        order: 2,
        clicks: 24,
        createdAt: 1730990200000
    }),
    Object.freeze({
        id: 'seed-link-4',
        title: '링크드인 커리어 프로필 및 네트워킹',
        url: 'https://www.linkedin.com',
        icon: '💼',
        order: 3,
        clicks: 5,
        createdAt: 1730990300000
    })
]);

/**
 * UI에서 사용자가 빠르게 선택할 수 있는 추천 아이콘(이모지) 목록
 */
export const PRESET_AVATAR_ICONS = Object.freeze([
    '🚀', '✨', '👩‍💻', '👨‍💻', '🎨', '🎧', '🌟', '🔥', '🦊', '🐱'
]);

export const PRESET_LINK_ICONS = Object.freeze([
    '🔗', '💻', '📝', '🎬', '💼', '📸', '🎵', '🛍️', '☕', '📧'
]);
