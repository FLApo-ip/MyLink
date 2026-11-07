/**
 * 입력값 유효성 검증 실패 시 발생하는 명시적 커스텀 에러 클래스입니다.
 * View 계층에서 어느 입력 필드(field)에 어떤 빨간색 경고 문구(message)를
 * 표시해야 하는지 명확히 전달합니다.
 */
export class ValidationError extends Error {
    #field;

    /**
     * @param {'name' | 'bio' | 'avatar' | 'username' | 'title' | 'url' | 'icon'} field - 오류가 발생한 필드 식별자
     * @param {string} message - 사용자에게 표시할 명시적 경고 메시지
     */
    constructor(field, message) {
        if (typeof field !== 'string' || field.trim().length === 0) {
            throw new TypeError('ValidationError 생성 시 유효한 field 문자열이 필요합니다.');
        }
        if (typeof message !== 'string' || message.trim().length === 0) {
            throw new TypeError('ValidationError 생성 시 유효한 message 문자열이 필요합니다.');
        }
        super(message);
        this.name = 'ValidationError';
        this.#field = field.trim();
    }

    /**
     * @returns {string} 오류가 발생한 필드명
     */
    get field() {
        return this.#field;
    }
}
