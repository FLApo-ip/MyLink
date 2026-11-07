import { StorageRepository } from './StorageRepository.js';
import { Profile } from '../models/Profile.js';
import { LinkItem } from '../models/LinkItem.js';
import { StorageCorruptedError } from '../errors/StorageCorruptedError.js';

/**
 * 브라우저 LocalStorage를 사용하여 프로필과 링크 목록의 영속성을 담당하는 저장소 구현체입니다.
 * 저장소 데이터가 손상(JSON 파싱 오류, 스키마 불일치 등)된 경우 침묵형 폴백으로 무시하지 않고,
 * 명시적인 StorageCorruptedError를 발생시켜 상위 계층에 알립니다.
 */
export class LocalStorageRepository extends StorageRepository {
    static DEFAULT_KEYS = Object.freeze({
        INITIALIZED: 'mylink_v1_initialized',
        PROFILE: 'mylink_v1_profile',
        LINKS: 'mylink_v1_links'
    });

    #storage;
    #keys;

    /**
     * @param {Storage} [storage=window.localStorage] - 주입할 스토리지 객체 (단위 테스트 격리 지원)
     * @param {Object} [customKeys] - 커스텀 스토리지 키 설정
     */
    constructor(storage = window.localStorage, customKeys = LocalStorageRepository.DEFAULT_KEYS) {
        super();
        if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
            throw new TypeError('유효한 Web Storage 인터페이스가 제공되지 않았습니다.');
        }
        this.#storage = storage;
        this.#keys = {
            INITIALIZED: customKeys.INITIALIZED,
            PROFILE: customKeys.PROFILE,
            LINKS: customKeys.LINKS
        };
    }

    /**
     * @override
     * @returns {boolean}
     */
    isInitialized() {
        return this.#storage.getItem(this.#keys.INITIALIZED) === 'true';
    }

    /**
     * @override
     */
    markInitialized() {
        this.#storage.setItem(this.#keys.INITIALIZED, 'true');
    }

    /**
     * @override
     * @returns {Profile | null}
     * @throws {StorageCorruptedError}
     */
    getProfile() {
        const raw = this.#storage.getItem(this.#keys.PROFILE);
        if (raw === null) {
            return null;
        }

        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch (parseError) {
            throw new StorageCorruptedError(
                this.#keys.PROFILE,
                '저장된 프로필 데이터의 JSON 형식이 손상되었습니다.',
                parseError
            );
        }

        try {
            return Profile.fromJSON(parsed);
        } catch (validationError) {
            throw new StorageCorruptedError(
                this.#keys.PROFILE,
                `저장된 프로필 데이터가 유효하지 않습니다: ${validationError.message}`,
                validationError
            );
        }
    }

    /**
     * @override
     * @param {Profile} profile
     */
    saveProfile(profile) {
        if (!(profile instanceof Profile)) {
            throw new TypeError('saveProfile에는 Profile 인스턴스만 전달할 수 있습니다.');
        }
        const serialized = JSON.stringify(profile.toJSON());
        this.#storage.setItem(this.#keys.PROFILE, serialized);
    }

    /**
     * @override
     * @returns {LinkItem[]}
     * @throws {StorageCorruptedError}
     */
    getLinks() {
        const raw = this.#storage.getItem(this.#keys.LINKS);
        if (raw === null) {
            return [];
        }

        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch (parseError) {
            throw new StorageCorruptedError(
                this.#keys.LINKS,
                '저장된 링크 목록 데이터의 JSON 형식이 손상되었습니다.',
                parseError
            );
        }

        if (!Array.isArray(parsed)) {
            throw new StorageCorruptedError(
                this.#keys.LINKS,
                '저장된 링크 목록 데이터가 배열 형식이 아닙니다.'
            );
        }

        try {
            return parsed.map((itemData) => LinkItem.fromJSON(itemData));
        } catch (validationError) {
            throw new StorageCorruptedError(
                this.#keys.LINKS,
                `저장된 링크 항목 중 손상된 데이터가 발견되었습니다: ${validationError.message}`,
                validationError
            );
        }
    }

    /**
     * @override
     * @param {LinkItem[]} links
     */
    saveLinks(links) {
        if (!Array.isArray(links) || !links.every((item) => item instanceof LinkItem)) {
            throw new TypeError('saveLinks에는 LinkItem 인스턴스 배열만 전달할 수 있습니다.');
        }
        const serialized = JSON.stringify(links.map((item) => item.toJSON()));
        this.#storage.setItem(this.#keys.LINKS, serialized);
    }

    /**
     * @override
     */
    clearStorage() {
        this.#storage.removeItem(this.#keys.INITIALIZED);
        this.#storage.removeItem(this.#keys.PROFILE);
        this.#storage.removeItem(this.#keys.LINKS);
    }
}
