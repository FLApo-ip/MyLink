import { StorageRepository } from '../repositories/StorageRepository.js';
import { Profile } from '../models/Profile.js';
import { LinkItem } from '../models/LinkItem.js';
import { EntityNotFoundError } from '../errors/EntityNotFoundError.js';
import { INITIAL_PROFILE_SEED, INITIAL_LINKS_SEED } from '../constants/SeedData.js';

/**
 * 마이링크(MyLink)의 핵심 비즈니스 규칙(프로필 관리, 링크 CRUD, 정렬, 클릭 통계 집계)을
 * 전담하는 서비스 클래스입니다.
 * 의존성 역전 원칙(DIP)에 따라 구체 클래스가 아닌 StorageRepository 인터페이스에 의존합니다.
 */
export class MyLinkService {
    #repository;

    /**
     * @param {StorageRepository} repository - 데이터 영속성 저장소 인스턴스
     */
    constructor(repository) {
        if (!(repository instanceof StorageRepository)) {
            throw new TypeError('MyLinkService는 StorageRepository를 상속한 저장소 인스턴스가 필요합니다.');
        }
        this.#repository = repository;
    }

    /**
     * 애플리케이션 초기 구동 시 저장소 상태를 확인하고,
     * 최초 실행인 경우에만 명시적 초기 시드 데이터를 로드합니다.
     * @returns {{ profile: Profile, links: LinkItem[] }}
     */
    initializeData() {
        const isInitialized = this.#repository.isInitialized();

        if (!isInitialized) {
            const seedProfile = Profile.fromJSON(INITIAL_PROFILE_SEED);
            const seedLinks = INITIAL_LINKS_SEED.map((seed) => LinkItem.fromJSON(seed));

            this.#repository.saveProfile(seedProfile);
            this.#repository.saveLinks(seedLinks);
            this.#repository.markInitialized();

            return {
                profile: seedProfile,
                links: this.#sortLinksByOrder(seedLinks)
            };
        }

        let profile = this.#repository.getProfile();
        if (profile === null) {
            // 초기화 플래그는 있으나 프로필이 누락된 경우 시드 프로필로 복원
            profile = Profile.fromJSON(INITIAL_PROFILE_SEED);
            this.#repository.saveProfile(profile);
        }

        const links = this.#repository.getLinks();
        return {
            profile,
            links: this.#sortLinksByOrder(links)
        };
    }

    /**
     * 현재 저장된 프로필을 조회합니다.
     * @returns {Profile}
     */
    getProfile() {
        const profile = this.#repository.getProfile();
        if (profile === null) {
            const seedProfile = Profile.fromJSON(INITIAL_PROFILE_SEED);
            this.#repository.saveProfile(seedProfile);
            return seedProfile;
        }
        return profile;
    }

    /**
     * 프로필 정보(이름, 소개, 아바타)를 수정하고 저장소에 반영합니다.
     * @param {string} name
     * @param {string} bio
     * @param {string} avatar
     * @returns {Profile}
     */
    updateProfile(name, bio, avatar) {
        const profile = this.getProfile();
        profile.updateProfile(name, bio, avatar);
        this.#repository.saveProfile(profile);
        return profile;
    }

    /**
     * 정렬 순서(order) 기준으로 정렬된 전체 링크 목록을 반환합니다.
     * @returns {LinkItem[]}
     */
    getLinks() {
        const links = this.#repository.getLinks();
        return this.#sortLinksByOrder(links);
    }

    /**
     * 특정 ID의 링크 항목을 조회합니다. 존재하지 않으면 EntityNotFoundError를 발생시킵니다.
     * @param {string} id
     * @returns {LinkItem}
     * @throws {EntityNotFoundError}
     */
    getLinkById(id) {
        const links = this.#repository.getLinks();
        const found = links.find((item) => item.id === id);
        if (!found) {
            throw new EntityNotFoundError(id, `요청한 링크(ID: ${id})를 찾을 수 없습니다.`);
        }
        return found;
    }

    /**
     * 새 링크를 추가하고 저장소에 반영합니다.
     * @param {string} title
     * @param {string} url
     * @param {string} icon
     * @returns {LinkItem} 생성된 새 링크 엔티티
     */
    addLink(title, url, icon) {
        const currentLinks = this.#repository.getLinks();
        const nextOrder =
            currentLinks.length === 0
                ? 0
                : Math.max(...currentLinks.map((item) => item.order)) + 1;

        const newLink = new LinkItem({
            id: this.#generateUniqueId(),
            title,
            url,
            icon,
            order: nextOrder,
            clicks: 0,
            createdAt: Date.now()
        });

        const updatedLinks = [...currentLinks, newLink];
        this.#repository.saveLinks(updatedLinks);
        return newLink;
    }

    /**
     * 기존 링크의 제목, URL, 아이콘 정보를 수정하고 저장소에 반영합니다.
     * @param {string} id
     * @param {string} title
     * @param {string} url
     * @param {string} icon
     * @returns {LinkItem} 수정된 링크 엔티티
     * @throws {EntityNotFoundError}
     */
    updateLink(id, title, url, icon) {
        const currentLinks = this.#repository.getLinks();
        const targetLink = currentLinks.find((item) => item.id === id);

        if (!targetLink) {
            throw new EntityNotFoundError(id, `수정할 링크(ID: ${id})를 찾을 수 없습니다.`);
        }

        targetLink.update(title, url, icon);
        this.#repository.saveLinks(currentLinks);
        return targetLink;
    }

    /**
     * 지정한 ID의 링크를 삭제하고 남은 링크들의 order 순서를 재정렬하여 저장합니다.
     * @param {string} id
     * @throws {EntityNotFoundError}
     */
    deleteLink(id) {
        const currentLinks = this.#repository.getLinks();
        const targetIndex = currentLinks.findIndex((item) => item.id === id);

        if (targetIndex === -1) {
            throw new EntityNotFoundError(id, `삭제할 링크(ID: ${id})를 찾을 수 없습니다.`);
        }

        currentLinks.splice(targetIndex, 1);

        const sortedRemaining = this.#sortLinksByOrder(currentLinks);
        sortedRemaining.forEach((item, index) => {
            item.updateOrder(index);
        });

        this.#repository.saveLinks(sortedRemaining);
    }

    /**
     * 특정 링크의 클릭 횟수를 1 증가시키고 저장소에 즉시 반영합니다 (F-06 클릭 통계).
     * 유효하지 않은 ID에 대해서는 즉시 EntityNotFoundError 예외를 발생시킵니다.
     * @param {string} id
     * @returns {LinkItem} 클릭수가 증가된 링크 엔티티
     * @throws {EntityNotFoundError}
     */
    recordLinkClick(id) {
        if (typeof id !== 'string' || id.trim().length === 0) {
            throw new EntityNotFoundError(String(id), '유효하지 않은 링크 ID에 대한 클릭 집계 요청입니다.');
        }

        const currentLinks = this.#repository.getLinks();
        const targetLink = currentLinks.find((item) => item.id === id);

        if (!targetLink) {
            throw new EntityNotFoundError(id, `클릭을 집계할 링크(ID: ${id})가 존재하지 않습니다.`);
        }

        targetLink.incrementClicks();
        this.#repository.saveLinks(currentLinks);
        return targetLink;
    }

    /**
     * 전체 링크의 총 클릭수 합계를 계산하여 반환합니다.
     * @returns {number}
     */
    getTotalClicks() {
        const links = this.#repository.getLinks();
        return links.reduce((sum, item) => sum + item.clicks, 0);
    }

    /**
     * 저장소 손상(StorageCorruptedError) 발생 시 사용자의 명시적 승인 하에
     * 저장소를 초기화하고 초기 시드 데이터로 복구합니다.
     * @returns {{ profile: Profile, links: LinkItem[] }}
     */
    resetToSeedData() {
        this.#repository.clearStorage();
        return this.initializeData();
    }

    /**
     * 링크 배열을 order 오름차순(동일 order 시 createdAt 오름차순)으로 정렬한 사본을 반환합니다.
     * @param {LinkItem[]} links
     * @returns {LinkItem[]}
     */
    #sortLinksByOrder(links) {
        return [...links].sort((a, b) => {
            if (a.order !== b.order) {
                return a.order - b.order;
            }
            return a.createdAt - b.createdAt;
        });
    }

    /**
     * 충돌 없는 고유 링크 식별자를 생성합니다.
     * @returns {string}
     */
    #generateUniqueId() {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return `link-${crypto.randomUUID()}`;
        }
        const randomPart = Math.random().toString(36).substring(2, 10);
        return `link-${Date.now()}-${randomPart}`;
    }
}
