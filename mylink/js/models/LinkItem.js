import { ValidationError } from '../errors/ValidationError.js';

/**
 * 개별 외부 링크 도메인 엔티티 클래스입니다.
 * 캡슐화 원칙에 따라 모든 속성은 Private 필드(#)로 보호되며,
 * URL 형식 오류 시 임의 보정(자동으로 https:// 붙이기 등)을 절대 수행하지 않고
 * 명시적인 ValidationError를 발생시킵니다.
 */
export class LinkItem {
    static MAX_TITLE_LENGTH = 60;
    static ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

    #id;
    #title;
    #url;
    #icon;
    #order;
    #clicks;
    #createdAt;

    /**
     * @param {Object} params
     * @param {string} params.id - 고유 식별자
     * @param {string} params.title - 링크 제목
     * @param {string} params.url - 이동할 전체 URL (http:// 또는 https:// 필수)
     * @param {string} params.icon - 대표 아이콘(이모지 등)
     * @param {number} params.order - 정렬 순서 (0 이상의 정수)
     * @param {number} [params.clicks=0] - 클릭 횟수 (0 이상의 정수)
     * @param {number} [params.createdAt=Date.now()] - 생성 타임스탬프
     */
    constructor({ id, title, url, icon, order, clicks = 0, createdAt = Date.now() }) {
        if (typeof id !== 'string' || id.trim().length === 0) {
            throw new TypeError('LinkItem 생성 시 유효한 id 문자열이 필요합니다.');
        }
        if (!Number.isInteger(order) || order < 0) {
            throw new TypeError('LinkItem 생성 시 order는 0 이상의 정수여야 합니다.');
        }
        if (!Number.isInteger(clicks) || clicks < 0) {
            throw new TypeError('LinkItem 생성 시 clicks는 0 이상의 정수여야 합니다.');
        }
        if (!Number.isInteger(createdAt) || createdAt <= 0) {
            throw new TypeError('LinkItem 생성 시 createdAt은 양의 정수 타임스탬프여야 합니다.');
        }

        LinkItem.validate({ title, url, icon });

        this.#id = id.trim();
        this.#title = title.trim();
        this.#url = url.trim();
        this.#icon = icon.trim();
        this.#order = order;
        this.#clicks = clicks;
        this.#createdAt = createdAt;
    }

    /**
     * 링크 제목, URL, 아이콘의 유효성을 엄격히 검증합니다.
     * @param {Object} params
     * @param {string} params.title
     * @param {string} params.url
     * @param {string} params.icon
     * @throws {ValidationError}
     */
    static validate({ title, url, icon }) {
        if (typeof title !== 'string' || title.trim().length === 0) {
            throw new ValidationError('title', '링크 제목을 입력해주세요.');
        }
        if (title.trim().length > LinkItem.MAX_TITLE_LENGTH) {
            throw new ValidationError(
                'title',
                `링크 제목은 최대 ${LinkItem.MAX_TITLE_LENGTH}자까지 입력할 수 있습니다.`
            );
        }

        if (typeof url !== 'string' || url.trim().length === 0) {
            throw new ValidationError('url', '올바른 URL 형식(https://...)을 입력해주세요.');
        }

        const trimmedUrl = url.trim();
        if (!LinkItem.#isValidHttpUrl(trimmedUrl)) {
            throw new ValidationError('url', '올바른 URL 형식(https://...)을 입력해주세요.');
        }

        if (typeof icon !== 'string' || icon.trim().length === 0) {
            throw new ValidationError('icon', '링크를 대표할 아이콘(이모지)을 선택하거나 입력해주세요.');
        }
    }

    /**
     * 문자열이 표준 http:// 또는 https:// 프로토콜과 유효한 도메인 구조를 갖추었는지 검증합니다.
     * @param {string} rawUrl
     * @returns {boolean}
     */
    static #isValidHttpUrl(rawUrl) {
        // 공백 문자가 포함된 URL 거부
        if (/\s/.test(rawUrl)) {
            return false;
        }
        // 명시적으로 http:// 또는 https://로 시작하는지 먼저 확인
        if (!/^https?:\/\//i.test(rawUrl)) {
            return false;
        }

        let parsedUrl;
        try {
            parsedUrl = new URL(rawUrl);
        } catch {
            return false;
        }

        if (!LinkItem.ALLOWED_PROTOCOLS.has(parsedUrl.protocol)) {
            return false;
        }

        const hostname = parsedUrl.hostname;
        if (!hostname) {
            return false;
        }

        // localhost이거나 최소 하나의 점(.)을 포함한 유효한 도메인 형태(예: example.com)여야 함
        const isLocalhost = hostname === 'localhost';
        const hasValidDomainDot =
            hostname.includes('.') &&
            !hostname.startsWith('.') &&
            !hostname.endsWith('.') &&
            hostname.split('.').every((part) => part.length > 0);

        return isLocalhost || hasValidDomainDot;
    }

    /**
     * 링크의 제목, URL, 아이콘 정보를 수정합니다.
     * @param {string} title
     * @param {string} url
     * @param {string} icon
     */
    update(title, url, icon) {
        LinkItem.validate({ title, url, icon });
        this.#title = title.trim();
        this.#url = url.trim();
        this.#icon = icon.trim();
    }

    /**
     * 정렬 순서를 변경합니다.
     * @param {number} newOrder
     */
    updateOrder(newOrder) {
        if (!Number.isInteger(newOrder) || newOrder < 0) {
            throw new TypeError('변경할 order 값은 0 이상의 정수여야 합니다.');
        }
        this.#order = newOrder;
    }

    /**
     * 클릭 횟수를 1 증가시키고 증가된 값을 반환합니다.
     * @returns {number} 증가된 후의 클릭 횟수
     */
    incrementClicks() {
        this.#clicks += 1;
        return this.#clicks;
    }

    get id() {
        return this.#id;
    }

    get title() {
        return this.#title;
    }

    get url() {
        return this.#url;
    }

    get icon() {
        return this.#icon;
    }

    get order() {
        return this.#order;
    }

    get clicks() {
        return this.#clicks;
    }

    get createdAt() {
        return this.#createdAt;
    }

    /**
     * 저장소 직렬화를 위한 순수 객체를 반환합니다.
     * @returns {{ id: string, title: string, url: string, icon: string, order: number, clicks: number, createdAt: number }}
     */
    toJSON() {
        return {
            id: this.#id,
            title: this.#title,
            url: this.#url,
            icon: this.#icon,
            order: this.#order,
            clicks: this.#clicks,
            createdAt: this.#createdAt
        };
    }

    /**
     * 저장소 역직렬화 시 데이터 무결성을 검증하여 LinkItem 인스턴스를 복원합니다.
     * @param {unknown} data
     * @returns {LinkItem}
     */
    static fromJSON(data) {
        if (data === null || typeof data !== 'object') {
            throw new TypeError('LinkItem 역직렬화 대상 데이터가 객체가 아닙니다.');
        }
        return new LinkItem({
            id: data.id,
            title: data.title,
            url: data.url,
            icon: data.icon,
            order: data.order,
            clicks: data.clicks,
            createdAt: data.createdAt
        });
    }
}
