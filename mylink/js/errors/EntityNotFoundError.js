/**
 * 존재하지 않거나 유효하지 않은 엔티티(LinkItem 등) ID에 대해
 * 조회, 수정, 삭제, 클릭 집계를 시도할 때 발생시키는 명시적 에러 클래스입니다.
 */
export class EntityNotFoundError extends Error {
    #entityId;

    /**
     * @param {string} entityId - 찾을 수 없는 엔티티 식별자
     * @param {string} message - 에러 상세 메시지
     */
    constructor(entityId, message) {
        super(message);
        this.name = 'EntityNotFoundError';
        this.#entityId = String(entityId);
    }

    /**
     * @returns {string} 조회에 실패한 엔티티 ID
     */
    get entityId() {
        return this.#entityId;
    }
}
