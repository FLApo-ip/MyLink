/**
 * 저장소(LocalStorage 등)의 데이터가 손상되었거나(JSON 파싱 오류)
 * 도메인 스키마 무결성 검증에 실패했을 때 침묵형 폴백 없이 발생시키는 에러 클래스입니다.
 */
export class StorageCorruptedError extends Error {
    #storageKey;
    #causeError;

    /**
     * @param {string} storageKey - 손상이 감지된 저장소 키
     * @param {string} message - 사용자에게 표시할 손상 안내 메시지
     * @param {Error} [causeError] - 근본 원인이 된 원본 에러 객체
     */
    constructor(storageKey, message, causeError = null) {
        super(message);
        this.name = 'StorageCorruptedError';
        this.#storageKey = storageKey;
        this.#causeError = causeError;
    }

    /**
     * @returns {string} 손상이 감지된 저장소 키
     */
    get storageKey() {
        return this.#storageKey;
    }

    /**
     * @returns {Error | null} 원본 에러 객체
     */
    get causeError() {
        return this.#causeError;
    }
}
