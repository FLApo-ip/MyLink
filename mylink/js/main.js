import { LocalStorageRepository } from './repositories/LocalStorageRepository.js';
import { MyLinkService } from './services/MyLinkService.js';
import { MyLinkView } from './views/MyLinkView.js';

/**
 * 마이링크(MyLink) 애플리케이션 부트스트랩 및 의존성 주입(Dependency Injection) 엔트리포인트입니다.
 * 저장소(Repository) -> 서비스(Service) -> 뷰(View) 순서로 객체를 조립하고 구동합니다.
 */
function bootstrapMyLinkApp() {
    const repository = new LocalStorageRepository(window.localStorage);
    const service = new MyLinkService(repository);
    const view = new MyLinkView(service);

    view.init();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapMyLinkApp);
} else {
    bootstrapMyLinkApp();
}
