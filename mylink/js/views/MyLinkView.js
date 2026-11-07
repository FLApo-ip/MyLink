import { MyLinkService } from '../services/MyLinkService.js';
import { ValidationError } from '../errors/ValidationError.js';
import { StorageCorruptedError } from '../errors/StorageCorruptedError.js';
import { EntityNotFoundError } from '../errors/EntityNotFoundError.js';
import { PRESET_AVATAR_ICONS, PRESET_LINK_ICONS } from '../constants/SeedData.js';
import { Profile } from '../models/Profile.js';

/**
 * 마이링크(MyLink) UI 컴포넌트 렌더링과 DOM 이벤트 핸들링을 전담하는 View/Controller 클래스입니다.
 * 비즈니스 로직이나 스토리지 직접 접근을 일절 수행하지 않으며,
 * 오직 MyLinkService의 공개 메서드를 호출하여 상태를 갱신합니다.
 */
export class MyLinkView {
    #service;
    #elements;
    #pendingDeleteId = null;

    /**
     * @param {MyLinkService} service
     */
    constructor(service) {
        if (!(service instanceof MyLinkService)) {
            throw new TypeError('MyLinkView 생성 시 유효한 MyLinkService 인스턴스가 필요합니다.');
        }
        this.#service = service;
        this.#elements = this.#cacheElements();
    }

    /**
     * 필수 DOM 요소를 탐색하여 캐싱하고 누락 여부를 검증합니다.
     */
    #cacheElements() {
        const requiredIds = {
            // 상단 및 에러 배너
            btnSharePage: 'btn-share-page',
            storageErrorBanner: 'storage-error-banner',
            storageErrorMessage: 'storage-error-message',
            btnResetStorage: 'btn-reset-storage',

            // 프로필 영역
            profileAvatar: 'profile-avatar',
            profileName: 'profile-name',
            profileHandle: 'profile-handle',
            profileBio: 'profile-bio',
            statTotalLinks: 'stat-total-links',
            statTotalClicks: 'stat-total-clicks',
            btnOpenProfileModal: 'btn-open-profile-modal',
            btnOpenAddLinkModal: 'btn-open-add-link-modal',

            // 링크 목록 영역
            linksList: 'links-list',
            linksEmptyState: 'links-empty-state',

            // 프로필 편집 모달
            modalProfile: 'modal-profile',
            formProfile: 'form-profile',
            btnCloseProfileModal: 'btn-close-profile-modal',
            btnCancelProfileModal: 'btn-cancel-profile-modal',
            inputProfileAvatar: 'input-profile-avatar',
            presetAvatarList: 'preset-avatar-list',
            inputProfileName: 'input-profile-name',
            counterProfileName: 'counter-profile-name',
            inputProfileBio: 'input-profile-bio',
            counterProfileBio: 'counter-profile-bio',
            errorProfileAvatar: 'error-profile-avatar',
            errorProfileName: 'error-profile-name',
            errorProfileBio: 'error-profile-bio',

            // 링크 추가/수정 모달
            modalLink: 'modal-link',
            modalLinkTitle: 'modal-link-title',
            formLink: 'form-link',
            btnCloseLinkModal: 'btn-close-link-modal',
            btnCancelLinkModal: 'btn-cancel-link-modal',
            inputLinkId: 'input-link-id',
            inputLinkIcon: 'input-link-icon',
            presetLinkIconList: 'preset-link-icon-list',
            inputLinkTitle: 'input-link-title',
            inputLinkUrl: 'input-link-url',
            errorLinkIcon: 'error-link-icon',
            errorLinkTitle: 'error-link-title',
            errorLinkUrl: 'error-link-url',

            // 링크 삭제 확인 모달
            modalDelete: 'modal-delete',
            btnCloseDeleteModal: 'btn-close-delete-modal',
            btnCancelDeleteModal: 'btn-cancel-delete-modal',
            btnConfirmDelete: 'btn-confirm-delete',
            deleteTargetTitle: 'delete-target-title',

            // 토스트
            toastContainer: 'toast-container'
        };

        const mapped = {};
        for (const [key, id] of Object.entries(requiredIds)) {
            const el = document.getElementById(id);
            if (!el) {
                throw new Error(`필수 DOM 요소(#${id})가 index.html에 존재하지 않습니다.`);
            }
            mapped[key] = el;
        }
        return mapped;
    }

    /**
     * 뷰를 초기화하고 이벤트 리스너를 바인딩한 뒤 초기 화면을 렌더링합니다.
     */
    init() {
        this.#renderPresetIconButtons();
        this.#bindEvents();
        this.#loadAndRenderAll();
    }

    /**
     * 저장소 데이터를 초기화/조회하여 화면에 렌더링합니다.
     * StorageCorruptedError 발생 시 침묵하지 않고 복구 배너를 표시합니다.
     */
    #loadAndRenderAll() {
        try {
            const { profile, links } = this.#service.initializeData();
            this.#hideStorageCorruptedBanner();
            this.renderProfile(profile);
            this.renderLinks(links);
            this.#updateSummaryStats(links);
        } catch (error) {
            if (error instanceof StorageCorruptedError) {
                this.#showStorageCorruptedBanner(error);
                return;
            }
            throw error;
        }
    }

    /**
     * 프로필 데이터를 화면 상단에 렌더링합니다 (F-01).
     * @param {Profile} profile
     */
    renderProfile(profile) {
        this.#elements.profileAvatar.textContent = profile.avatar;
        this.#elements.profileName.textContent = profile.name;
        this.#elements.profileHandle.textContent = `@${profile.username}`;
        this.#elements.profileBio.textContent = profile.bio;
        document.title = `${profile.name} | 마이링크 (MyLink)`;
    }

    /**
     * 링크 목록을 카드형 버튼 컴포넌트로 렌더링합니다 (F-02, F-06).
     * XSS 방지를 위해 innerHTML 문자열 조합 대신 DOM API(createElement, textContent)를 사용합니다.
     * @param {import('../models/LinkItem.js').LinkItem[]} links
     */
    renderLinks(links) {
        const listEl = this.#elements.linksList;
        listEl.replaceChildren();

        if (links.length === 0) {
            this.#elements.linksEmptyState.classList.remove('hidden');
            return;
        }

        this.#elements.linksEmptyState.classList.add('hidden');

        const fragment = document.createDocumentFragment();
        for (const link of links) {
            const cardItem = this.#createLinkCardElement(link);
            fragment.appendChild(cardItem);
        }
        listEl.appendChild(fragment);
    }

    /**
     * 단일 LinkItem 엔티티에 대한 DOM 요소를 생성합니다.
     * @param {import('../models/LinkItem.js').LinkItem} link
     * @returns {HTMLLIElement}
     */
    #createLinkCardElement(link) {
        const li = document.createElement('li');
        li.className = 'link-card';
        li.dataset.linkId = link.id;

        // 클릭 가능한 앵커 영역 (아이콘 + 제목 + URL)
        const anchor = document.createElement('a');
        anchor.className = 'link-anchor';
        anchor.href = link.url;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        anchor.dataset.action = 'visit-link';
        anchor.dataset.linkId = link.id;
        anchor.setAttribute('aria-label', `${link.title} (${link.url}) 새 탭으로 열기`);

        const iconBox = document.createElement('div');
        iconBox.className = 'link-icon-box';
        iconBox.setAttribute('aria-hidden', 'true');
        iconBox.textContent = link.icon;

        const metaBox = document.createElement('div');
        metaBox.className = 'link-meta';

        const titleEl = document.createElement('span');
        titleEl.className = 'link-title';
        titleEl.textContent = link.title;

        const urlEl = document.createElement('span');
        urlEl.className = 'link-url';
        urlEl.textContent = link.url;

        metaBox.append(titleEl, urlEl);
        anchor.append(iconBox, metaBox);

        // 우측 클릭 통계 배지 및 수정/삭제 액션 버튼
        const rightZone = document.createElement('div');
        rightZone.className = 'link-right-zone';

        const clickBadge = document.createElement('span');
        clickBadge.className = 'click-badge';
        clickBadge.dataset.role = 'click-counter';
        clickBadge.title = '누적 클릭 횟수';
        clickBadge.textContent = `🔥 ${link.clicks}회`;

        const actionsBox = document.createElement('div');
        actionsBox.className = 'link-card-actions';

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'btn-card-action';
        editBtn.dataset.action = 'edit-link';
        editBtn.dataset.linkId = link.id;
        editBtn.title = '링크 수정';
        editBtn.setAttribute('aria-label', `${link.title} 수정`);
        editBtn.textContent = '✏️';

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'btn-card-action btn-delete-action';
        deleteBtn.dataset.action = 'delete-link';
        deleteBtn.dataset.linkId = link.id;
        deleteBtn.title = '링크 삭제';
        deleteBtn.setAttribute('aria-label', `${link.title} 삭제`);
        deleteBtn.textContent = '🗑️';

        actionsBox.append(editBtn, deleteBtn);
        rightZone.append(clickBadge, actionsBox);

        li.append(anchor, rightZone);
        return li;
    }

    /**
     * 상단 요약 통계(총 링크 수, 총 누적 클릭수)를 갱신합니다.
     * @param {import('../models/LinkItem.js').LinkItem[]} links
     */
    #updateSummaryStats(links) {
        const totalLinks = links.length;
        const totalClicks = links.reduce((sum, item) => sum + item.clicks, 0);
        this.#elements.statTotalLinks.textContent = String(totalLinks);
        this.#elements.statTotalClicks.textContent = String(totalClicks);
    }

    /**
     * 추천 아이콘(이모지) 프리셋 버튼들을 생성합니다.
     */
    #renderPresetIconButtons() {
        const avatarContainer = this.#elements.presetAvatarList;
        avatarContainer.replaceChildren();
        for (const emoji of PRESET_AVATAR_ICONS) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn-preset-icon';
            btn.dataset.emoji = emoji;
            btn.textContent = emoji;
            btn.setAttribute('aria-label', `아바타 이모지 ${emoji} 선택`);
            avatarContainer.appendChild(btn);
        }

        const linkIconContainer = this.#elements.presetLinkIconList;
        linkIconContainer.replaceChildren();
        for (const emoji of PRESET_LINK_ICONS) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn-preset-icon';
            btn.dataset.emoji = emoji;
            btn.textContent = emoji;
            btn.setAttribute('aria-label', `링크 아이콘 ${emoji} 선택`);
            linkIconContainer.appendChild(btn);
        }
    }

    /**
     * 사용자 인터랙션 이벤트를 등록합니다.
     */
    #bindEvents() {
        // 공유하기 버튼
        this.#elements.btnSharePage.addEventListener('click', () => this.#handleSharePage());

        // 저장소 초기화 복구 버튼 (StorageCorruptedError 발생 시)
        this.#elements.btnResetStorage.addEventListener('click', () => {
            const { profile, links } = this.#service.resetToSeedData();
            this.#hideStorageCorruptedBanner();
            this.renderProfile(profile);
            this.renderLinks(links);
            this.#updateSummaryStats(links);
            this.#showToast('저장소가 초기 시드 데이터로 안전하게 복구되었습니다.');
        });

        // 프로필 모달 열기/닫기
        this.#elements.btnOpenProfileModal.addEventListener('click', () => this.#openProfileModal());
        this.#elements.btnCloseProfileModal.addEventListener('click', () => this.#closeProfileModal());
        this.#elements.btnCancelProfileModal.addEventListener('click', () => this.#closeProfileModal());

        // 프로필 프리셋 이모지 클릭
        this.#elements.presetAvatarList.addEventListener('click', (event) => {
            const target = event.target.closest('button[data-emoji]');
            if (!target) return;
            this.#elements.inputProfileAvatar.value = target.dataset.emoji;
            this.#clearFieldError(this.#elements.inputProfileAvatar, this.#elements.errorProfileAvatar);
        });

        // 프로필 입력값 변경 시 실시간 글자수 카운터 갱신 및 에러 상태 해제
        this.#elements.inputProfileName.addEventListener('input', () => {
            this.#updateProfileCounters();
            this.#clearFieldError(this.#elements.inputProfileName, this.#elements.errorProfileName);
        });
        this.#elements.inputProfileBio.addEventListener('input', () => {
            this.#updateProfileCounters();
            this.#clearFieldError(this.#elements.inputProfileBio, this.#elements.errorProfileBio);
        });
        this.#elements.inputProfileAvatar.addEventListener('input', () => {
            this.#clearFieldError(this.#elements.inputProfileAvatar, this.#elements.errorProfileAvatar);
        });

        // 프로필 저장 제출
        this.#elements.formProfile.addEventListener('submit', (event) => {
            event.preventDefault();
            this.#handleProfileSubmit();
        });

        // 링크 추가 모달 열기/닫기
        this.#elements.btnOpenAddLinkModal.addEventListener('click', () => this.#openAddLinkModal());
        this.#elements.btnCloseLinkModal.addEventListener('click', () => this.#closeLinkModal());
        this.#elements.btnCancelLinkModal.addEventListener('click', () => this.#closeLinkModal());

        // 링크 프리셋 아이콘 클릭
        this.#elements.presetLinkIconList.addEventListener('click', (event) => {
            const target = event.target.closest('button[data-emoji]');
            if (!target) return;
            this.#elements.inputLinkIcon.value = target.dataset.emoji;
            this.#clearFieldError(this.#elements.inputLinkIcon, this.#elements.errorLinkIcon);
        });

        // 링크 폼 입력 시 해당 필드의 경고 메시지 즉시 해제
        this.#elements.inputLinkTitle.addEventListener('input', () => {
            this.#clearFieldError(this.#elements.inputLinkTitle, this.#elements.errorLinkTitle);
        });
        this.#elements.inputLinkUrl.addEventListener('input', () => {
            this.#clearFieldError(this.#elements.inputLinkUrl, this.#elements.errorLinkUrl);
        });
        this.#elements.inputLinkIcon.addEventListener('input', () => {
            this.#clearFieldError(this.#elements.inputLinkIcon, this.#elements.errorLinkIcon);
        });

        // 링크 추가/수정 폼 제출
        this.#elements.formLink.addEventListener('submit', (event) => {
            event.preventDefault();
            this.#handleLinkSubmit();
        });

        // 삭제 모달 닫기 및 확인
        this.#elements.btnCloseDeleteModal.addEventListener('click', () => this.#closeDeleteModal());
        this.#elements.btnCancelDeleteModal.addEventListener('click', () => this.#closeDeleteModal());
        this.#elements.btnConfirmDelete.addEventListener('click', () => this.#handleConfirmDelete());

        // 링크 목록 이벤트 위임 (링크 방문 클릭 집계 / 수정 버튼 / 삭제 버튼)
        this.#elements.linksList.addEventListener('click', (event) => {
            const actionElement = event.target.closest('[data-action]');
            if (!actionElement) return;

            const action = actionElement.dataset.action;
            const linkId = actionElement.dataset.linkId;

            if (action === 'visit-link') {
                this.#handleLinkVisit(linkId);
            } else if (action === 'edit-link') {
                event.preventDefault();
                this.#openEditLinkModal(linkId);
            } else if (action === 'delete-link') {
                event.preventDefault();
                this.#openDeleteModal(linkId);
            }
        });

        // 모달 배경 클릭 시 닫기 및 Escape 키 닫기
        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.#closeProfileModal();
                this.#closeLinkModal();
                this.#closeDeleteModal();
            }
        });
    }

    /**
     * 프로필 편집 모달을 열고 현재 프로필 값을 채웁니다 (시나리오 2).
     */
    #openProfileModal() {
        const profile = this.#service.getProfile();
        this.#clearAllProfileErrors();

        this.#elements.inputProfileAvatar.value = profile.avatar;
        this.#elements.inputProfileName.value = profile.name;
        this.#elements.inputProfileBio.value = profile.bio;
        this.#updateProfileCounters();

        this.#elements.modalProfile.classList.remove('hidden');
        this.#elements.inputProfileName.focus();
    }

    #closeProfileModal() {
        this.#elements.modalProfile.classList.add('hidden');
    }

    #updateProfileCounters() {
        const nameLen = this.#elements.inputProfileName.value.trim().length;
        const bioLen = this.#elements.inputProfileBio.value.trim().length;
        this.#elements.counterProfileName.textContent = `${nameLen} / ${Profile.MAX_NAME_LENGTH}`;
        this.#elements.counterProfileBio.textContent = `${bioLen} / ${Profile.MAX_BIO_LENGTH}`;
    }

    /**
     * 프로필 수정 폼 제출을 처리하고 ValidationError 발생 시 빨간색 경고 문구를 표시합니다.
     */
    #handleProfileSubmit() {
        this.#clearAllProfileErrors();

        const name = this.#elements.inputProfileName.value;
        const bio = this.#elements.inputProfileBio.value;
        const avatar = this.#elements.inputProfileAvatar.value;

        try {
            const updatedProfile = this.#service.updateProfile(name, bio, avatar);
            this.renderProfile(updatedProfile);
            this.#closeProfileModal();
            this.#showToast('프로필이 성공적으로 저장되었습니다.');
        } catch (error) {
            if (error instanceof ValidationError) {
                this.#showProfileValidationError(error);
                return;
            }
            throw error;
        }
    }

    /**
     * 새 링크 추가 모달을 엽니다 (시나리오 3).
     */
    #openAddLinkModal() {
        this.#clearAllLinkErrors();
        this.#elements.modalLinkTitle.textContent = '새 링크 추가';
        this.#elements.inputLinkId.value = '';
        this.#elements.inputLinkIcon.value = '🔗';
        this.#elements.inputLinkTitle.value = '';
        this.#elements.inputLinkUrl.value = '';

        this.#elements.modalLink.classList.remove('hidden');
        this.#elements.inputLinkTitle.focus();
    }

    /**
     * 기존 링크 수정 모달을 열고 데이터를 채웁니다 (시나리오 6).
     * @param {string} linkId
     */
    #openEditLinkModal(linkId) {
        try {
            const targetLink = this.#service.getLinkById(linkId);
            this.#clearAllLinkErrors();

            this.#elements.modalLinkTitle.textContent = '링크 정보 수정';
            this.#elements.inputLinkId.value = targetLink.id;
            this.#elements.inputLinkIcon.value = targetLink.icon;
            this.#elements.inputLinkTitle.value = targetLink.title;
            this.#elements.inputLinkUrl.value = targetLink.url;

            this.#elements.modalLink.classList.remove('hidden');
            this.#elements.inputLinkTitle.focus();
        } catch (error) {
            if (error instanceof EntityNotFoundError) {
                this.#showToast(error.message);
                return;
            }
            throw error;
        }
    }

    #closeLinkModal() {
        this.#elements.modalLink.classList.add('hidden');
    }

    /**
     * 링크 추가 또는 수정 폼 제출을 처리합니다 (시나리오 4, 5, 6).
     * 잘못된 URL이나 빈 제목 입력 시 ValidationError를 포착하여 빨간색 경고 문구를 표시합니다.
     */
    #handleLinkSubmit() {
        this.#clearAllLinkErrors();

        const editingId = this.#elements.inputLinkId.value.trim();
        const title = this.#elements.inputLinkTitle.value;
        const url = this.#elements.inputLinkUrl.value;
        const icon = this.#elements.inputLinkIcon.value;

        try {
            if (editingId.length > 0) {
                this.#service.updateLink(editingId, title, url, icon);
                this.#showToast('링크 정보가 수정되었습니다.');
            } else {
                this.#service.addLink(title, url, icon);
                this.#showToast('새 링크가 추가되었습니다.');
            }

            const updatedLinks = this.#service.getLinks();
            this.renderLinks(updatedLinks);
            this.#updateSummaryStats(updatedLinks);
            this.#closeLinkModal();
        } catch (error) {
            if (error instanceof ValidationError) {
                this.#showLinkValidationError(error);
                return;
            }
            if (error instanceof EntityNotFoundError) {
                this.#showToast(error.message);
                this.#closeLinkModal();
                return;
            }
            throw error;
        }
    }

    /**
     * 링크 삭제 확인 모달을 엽니다 (F-05).
     * @param {string} linkId
     */
    #openDeleteModal(linkId) {
        try {
            const targetLink = this.#service.getLinkById(linkId);
            this.#pendingDeleteId = targetLink.id;
            this.#elements.deleteTargetTitle.textContent = `'${targetLink.title}'`;
            this.#elements.modalDelete.classList.remove('hidden');
        } catch (error) {
            if (error instanceof EntityNotFoundError) {
                this.#showToast(error.message);
                return;
            }
            throw error;
        }
    }

    #closeDeleteModal() {
        this.#pendingDeleteId = null;
        this.#elements.modalDelete.classList.add('hidden');
    }

    /**
     * 삭제 확인 버튼 클릭 시 저장소와 화면에서 해당 링크를 제거합니다.
     */
    #handleConfirmDelete() {
        if (!this.#pendingDeleteId) return;

        try {
            this.#service.deleteLink(this.#pendingDeleteId);
            const updatedLinks = this.#service.getLinks();
            this.renderLinks(updatedLinks);
            this.#updateSummaryStats(updatedLinks);
            this.#closeDeleteModal();
            this.#showToast('링크가 삭제되었습니다.');
        } catch (error) {
            if (error instanceof EntityNotFoundError) {
                this.#showToast(error.message);
                this.#closeDeleteModal();
                return;
            }
            throw error;
        }
    }

    /**
     * 링크 카드 클릭 시 클릭수를 1 증가시키고 화면 배지와 저장소에 즉시 반영합니다 (시나리오 7, F-06).
     * 앵커의 기본 동작(target="_blank" 새 탭 열기)은 그대로 유지됩니다.
     * @param {string} linkId
     */
    #handleLinkVisit(linkId) {
        try {
            const updatedItem = this.#service.recordLinkClick(linkId);
            const cardEl = this.#elements.linksList.querySelector(`li[data-link-id="${linkId}"]`);
            if (cardEl) {
                const counterBadge = cardEl.querySelector('[data-role="click-counter"]');
                if (counterBadge) {
                    counterBadge.textContent = `🔥 ${updatedItem.clicks}회`;
                }
            }
            const allLinks = this.#service.getLinks();
            this.#updateSummaryStats(allLinks);
        } catch (error) {
            if (error instanceof EntityNotFoundError) {
                this.#showToast(error.message);
                return;
            }
            throw error;
        }
    }

    /**
     * 현재 페이지 URL을 클립보드에 복사합니다.
     */
    async #handleSharePage() {
        const shareUrl = window.location.href;
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            try {
                await navigator.clipboard.writeText(shareUrl);
                this.#showToast('마이링크 페이지 주소가 클립보드에 복사되었습니다!');
                return;
            } catch {
                // 클립보드 권한 거부 시 안내 토스트 표시
            }
        }
        this.#showToast(`공유 주소: ${shareUrl}`);
    }

    /**
     * 프로필 모달 내 ValidationError를 해당 입력창 테두리와 하단 경고 문구로 표시합니다.
     * @param {ValidationError} error
     */
    #showProfileValidationError(error) {
        const fieldMap = {
            name: {
                input: this.#elements.inputProfileName,
                errorEl: this.#elements.errorProfileName
            },
            bio: {
                input: this.#elements.inputProfileBio,
                errorEl: this.#elements.errorProfileBio
            },
            avatar: {
                input: this.#elements.inputProfileAvatar,
                errorEl: this.#elements.errorProfileAvatar
            }
        };

        const target = fieldMap[error.field];
        if (!target) {
            throw error;
        }

        this.#setFieldError(target.input, target.errorEl, error.message);
    }

    /**
     * 링크 모달 내 ValidationError를 해당 입력창 테두리와 하단 빨간색 경고 문구로 표시합니다.
     * @param {ValidationError} error
     */
    #showLinkValidationError(error) {
        const fieldMap = {
            title: {
                input: this.#elements.inputLinkTitle,
                errorEl: this.#elements.errorLinkTitle
            },
            url: {
                input: this.#elements.inputLinkUrl,
                errorEl: this.#elements.errorLinkUrl
            },
            icon: {
                input: this.#elements.inputLinkIcon,
                errorEl: this.#elements.errorLinkIcon
            }
        };

        const target = fieldMap[error.field];
        if (!target) {
            throw error;
        }

        this.#setFieldError(target.input, target.errorEl, error.message);
    }

    /**
     * 특정 입력 필드에 빨간색 테두리(.error-state)와 경고 문구를 활성화합니다.
     * @param {HTMLElement} inputEl
     * @param {HTMLElement} errorEl
     * @param {string} message
     */
    #setFieldError(inputEl, errorEl, message) {
        inputEl.classList.add('error-state');
        inputEl.setAttribute('aria-invalid', 'true');
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
        inputEl.focus();
    }

    /**
     * 특정 입력 필드의 경고 상태를 해제합니다.
     * @param {HTMLElement} inputEl
     * @param {HTMLElement} errorEl
     */
    #clearFieldError(inputEl, errorEl) {
        inputEl.classList.remove('error-state');
        inputEl.removeAttribute('aria-invalid');
        errorEl.textContent = '';
        errorEl.classList.add('hidden');
    }

    #clearAllProfileErrors() {
        this.#clearFieldError(this.#elements.inputProfileName, this.#elements.errorProfileName);
        this.#clearFieldError(this.#elements.inputProfileBio, this.#elements.errorProfileBio);
        this.#clearFieldError(this.#elements.inputProfileAvatar, this.#elements.errorProfileAvatar);
    }

    #clearAllLinkErrors() {
        this.#clearFieldError(this.#elements.inputLinkTitle, this.#elements.errorLinkTitle);
        this.#clearFieldError(this.#elements.inputLinkUrl, this.#elements.errorLinkUrl);
        this.#clearFieldError(this.#elements.inputLinkIcon, this.#elements.errorLinkIcon);
    }

    /**
     * StorageCorruptedError 발생 시 사용자에게 명시적인 복구 안내 배너를 표시합니다.
     * @param {StorageCorruptedError} error
     */
    #showStorageCorruptedBanner(error) {
        this.#elements.storageErrorMessage.textContent = `${error.message} (키: ${error.storageKey})`;
        this.#elements.storageErrorBanner.classList.remove('hidden');
    }

    #hideStorageCorruptedBanner() {
        this.#elements.storageErrorBanner.classList.add('hidden');
    }

    /**
     * 화면 하단에 토스트 피드백 메시지를 잠시 표시합니다.
     * @param {string} message
     */
    #showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-item';
        toast.textContent = message;
        this.#elements.toastContainer.appendChild(toast);

        window.setTimeout(() => {
            toast.remove();
        }, 2800);
    }
}
