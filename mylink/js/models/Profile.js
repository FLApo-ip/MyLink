import { ValidationError } from '../errors/ValidationError.js';

/**
 * 사용자 프로필 도메인 엔티티 클래스입니다.
 * 캡슐화 원칙에 따라 모든 속성은 Private 필드(#)로 보호되며,
 * 생성 및 수정 시 자체 유효성 검증(validate)을 강제합니다.
 */
export class Profile {
    static MAX_NAME_LENGTH = 30;
    static MAX_BIO_LENGTH = 100;
    static MAX_USERNAME_LENGTH = 30;

    #name;
    #bio;
    #avatar;
    #username;

    /**
     * @param {Object} params
     * @param {string} params.name - 사용자 이름 (1~30자)
     * @param {string} params.bio - 한 줄 소개 (0~100자)
     * @param {string} params.avatar - 프로필 아바타 이모지 또는 이미지 문자열
     * @param {string} params.username - 사용자 고유 식별 핸들
     */
    constructor({ name, bio, avatar, username }) {
        Profile.validate({ name, bio, avatar, username });

        this.#name = name.trim();
        this.#bio = bio.trim();
        this.#avatar = avatar.trim();
        this.#username = username.trim();
    }

    /**
     * 프로필 입력 데이터의 무결성을 검증합니다.
     * @param {Object} params
     * @param {string} params.name
     * @param {string} params.bio
     * @param {string} params.avatar
     * @param {string} params.username
     * @throws {ValidationError} 검증 실패 시 필드명과 경고 메시지를 포함하여 발생
     */
    static validate({ name, bio, avatar, username }) {
        if (typeof name !== 'string' || name.trim().length === 0) {
            throw new ValidationError('name', '이름을 입력해주세요.');
        }
        if (name.trim().length > Profile.MAX_NAME_LENGTH) {
            throw new ValidationError(
                'name',
                `이름은 최대 ${Profile.MAX_NAME_LENGTH}자까지 입력할 수 있습니다.`
            );
        }

        if (typeof bio !== 'string') {
            throw new ValidationError('bio', '한 줄 소개 형식이 올바르지 않습니다.');
        }
        if (bio.trim().length > Profile.MAX_BIO_LENGTH) {
            throw new ValidationError(
                'bio',
                `한 줄 소개는 최대 ${Profile.MAX_BIO_LENGTH}자까지 입력할 수 있습니다.`
            );
        }

        if (typeof avatar !== 'string' || avatar.trim().length === 0) {
            throw new ValidationError('avatar', '프로필 아이콘(이모지)을 입력해주세요.');
        }

        if (typeof username !== 'string' || username.trim().length === 0) {
            throw new ValidationError('username', '사용자 핸들(username)이 유효하지 않습니다.');
        }
        if (username.trim().length > Profile.MAX_USERNAME_LENGTH) {
            throw new ValidationError(
                'username',
                `사용자 핸들은 최대 ${Profile.MAX_USERNAME_LENGTH}자까지 설정할 수 있습니다.`
            );
        }
    }

    /**
     * 프로필 정보를 갱신합니다. 검증 통과 시에만 내부 상태가 변경됩니다.
     * @param {string} name
     * @param {string} bio
     * @param {string} avatar
     */
    updateProfile(name, bio, avatar) {
        Profile.validate({
            name,
            bio,
            avatar,
            username: this.#username
        });

        this.#name = name.trim();
        this.#bio = bio.trim();
        this.#avatar = avatar.trim();
    }

    get name() {
        return this.#name;
    }

    get bio() {
        return this.#bio;
    }

    get avatar() {
        return this.#avatar;
    }

    get username() {
        return this.#username;
    }

    /**
     * 직렬화를 위한 순수 객체를 반환합니다.
     * @returns {{ name: string, bio: string, avatar: string, username: string }}
     */
    toJSON() {
        return {
            name: this.#name,
            bio: this.#bio,
            avatar: this.#avatar,
            username: this.#username
        };
    }

    /**
     * 역직렬화 시 데이터 스키마와 타입을 검증하여 Profile 인스턴스를 생성합니다.
     * @param {unknown} data
     * @returns {Profile}
     */
    static fromJSON(data) {
        if (data === null || typeof data !== 'object') {
            throw new TypeError('Profile 역직렬화 대상 데이터가 객체가 아닙니다.');
        }
        return new Profile({
            name: data.name,
            bio: data.bio,
            avatar: data.avatar,
            username: data.username
        });
    }
}
