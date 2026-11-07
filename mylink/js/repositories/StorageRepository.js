/**
 * 데이터 영속성 계층의 추상 인터페이스 클래스입니다.
 * 개방-폐쇄 원칙(OCP)과 의존성 역전 원칙(DIP)에 따라,
 * 추후 LocalStorageRepository 대신 FirebaseRepository(Firestore + Google Auth)로
 * 교체하더라도 MyLinkService의 비즈니스 로직 수정이 전혀 없도록 계약을 정의합니다.
 */
export class StorageRepository {
    constructor() {
        if (new.target === StorageRepository) {
            throw new TypeError('StorageRepository는 추상 클래스이므로 직접 인스턴스화할 수 없습니다.');
        }
    }

    /**
     * 저장소가 최초 초기화되었는지 여부를 반환합니다.
     * @returns {boolean}
     */
    isInitialized() {
        throw new Error('isInitialized() 메서드는 하위 클래스에서 구현해야 합니다.');
    }

    /**
     * 저장소 초기화 완료 플래그를 기록합니다.
     */
    markInitialized() {
        throw new Error('markInitialized() 메서드는 하위 클래스에서 구현해야 합니다.');
    }

    /**
     * 저장된 프로필 엔티티를 조회합니다.
     * @returns {import('../models/Profile.js').Profile | null}
     */
    getProfile() {
        throw new Error('getProfile() 메서드는 하위 클래스에서 구현해야 합니다.');
    }

    /**
     * 프로필 엔티티를 저장소에 영구 반영합니다.
     * @param {import('../models/Profile.js').Profile} profile
     */
    saveProfile(profile) {
        throw new Error('saveProfile() 메서드는 하위 클래스에서 구현해야 합니다.');
    }

    /**
     * 저장된 모든 링크 엔티티 배열을 조회합니다.
     * @returns {import('../models/LinkItem.js').LinkItem[]}
     */
    getLinks() {
        throw new Error('getLinks() 메서드는 하위 클래스에서 구현해야 합니다.');
    }

    /**
     * 링크 엔티티 배열을 저장소에 영구 반영합니다.
     * @param {import('../models/LinkItem.js').LinkItem[]} links
     */
    saveLinks(links) {
        throw new Error('saveLinks() 메서드는 하위 클래스에서 구현해야 합니다.');
    }

    /**
     * 저장소의 모든 데이터를 초기화(제거)합니다.
     */
    clearStorage() {
        throw new Error('clearStorage() 메서드는 하위 클래스에서 구현해야 합니다.');
    }
}
