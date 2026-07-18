export interface PreFlightPayload {
  profileId: string;
  appId: string;
  accountId: string;
  pageId?: string;
  pixelId?: string;
  mediaId?: string;
  campaignName?: string;
  adSetCount?: number;
  budget?: number;
  link?: string;
  tracking?: string;
}

export enum CheckStatus {
  EXECUTED = 'EXECUTED',
  REUSED = 'REUSED',
}

export interface CheckResult {
  id: string;
  name: string;
  status: CheckStatus;
  passed: boolean;
  message: string;
  isObligatory: boolean;
}

export interface PreFlightValidationRepository {
  verifyProfileApp(profileId: string, appId: string): Promise<boolean>;
  verifyProfileAccount(profileId: string, accountId: string): Promise<boolean>;
  verifyAccountPage(accountId: string, pageId: string): Promise<boolean>;
  verifyAccountPixel(accountId: string, pixelId: string): Promise<boolean>;
}

export class ExecutePreFlightUseCase {
  constructor(private readonly repository: PreFlightValidationRepository) {}

  public async execute(
    newPayload: PreFlightPayload,
    oldPayload?: PreFlightPayload,
    oldResults?: CheckResult[],
  ): Promise<CheckResult[]> {
    const results: CheckResult[] = [];

    const changedProfile = oldPayload?.profileId !== newPayload.profileId;
    const changedApp = oldPayload?.appId !== newPayload.appId;
    const changedAccount = oldPayload?.accountId !== newPayload.accountId;
    const changedPage = oldPayload?.pageId !== newPayload.pageId;
    const changedPixel = oldPayload?.pixelId !== newPayload.pixelId;
    const changedMedia = oldPayload?.mediaId !== newPayload.mediaId;
    const changedCampaign =
      oldPayload?.campaignName !== newPayload.campaignName ||
      oldPayload?.adSetCount !== newPayload.adSetCount;
    const changedBudget = oldPayload?.budget !== newPayload.budget;
    const changedLink = oldPayload?.link !== newPayload.link;
    const changedTracking = oldPayload?.tracking !== newPayload.tracking;

    const isFirstRun = !oldPayload || !oldResults;

    const requireProfileCheck = isFirstRun || changedProfile || changedApp;
    const requireAccountCheck = requireProfileCheck || changedAccount;
    const requirePageCheck = requireAccountCheck || changedPage;
    const requirePixelCheck = requireAccountCheck || changedPixel;

    const requireMediaCheck = isFirstRun || changedProfile || changedMedia;
    const requireCampaignCheck = isFirstRun || changedProfile || changedCampaign;
    const requireBudgetCheck = isFirstRun || changedProfile || changedBudget;
    const requireLinkCheck = isFirstRun || changedProfile || changedLink;
    const requireTrackingCheck = isFirstRun || changedProfile || changedTracking;

    // Perfil, Proxy e Credencial
    const profilePassed =
      !!newPayload.profileId &&
      !!newPayload.appId &&
      (await this.repository.verifyProfileApp(newPayload.profileId, newPayload.appId));
    results.push(
      this.buildResult(
        'check_profile', 'Perfil, Proxy e Credencial', requireProfileCheck, profilePassed,
        'Proxy e credencial válidos.',
        'Perfil selecionado não possui proxy ou aplicativo inválido.',
        oldResults,
      ),
    );

    // Aplicativo e Conta
    const accountPassed =
      !!newPayload.accountId &&
      (await this.repository.verifyProfileAccount(newPayload.profileId, newPayload.accountId));
    results.push(
      this.buildResult(
        'check_account', 'Aplicativo e Conta', requireAccountCheck, accountPassed,
        'Aplicativo e conta pertencem ao perfil.',
        'Aplicativo ou conta não pertencem ao perfil.',
        oldResults,
      ),
    );

    // Página
    const pagePassed =
      !!newPayload.pageId &&
      (await this.repository.verifyAccountPage(newPayload.accountId, newPayload.pageId));
    results.push(
      this.buildResult(
        'check_page', 'Página do Facebook', requirePageCheck, pagePassed,
        'Página disponível na conta.',
        'Página não selecionada ou não pertence à conta.',
        oldResults,
      ),
    );

    // Pixel
    const pixelPassed =
      !!newPayload.pixelId &&
      (await this.repository.verifyAccountPixel(newPayload.accountId, newPayload.pixelId));
    results.push(
      this.buildResult(
        'check_pixel', 'Pixel de Rastreamento', requirePixelCheck, pixelPassed,
        'Pixel disponível na conta selecionada.',
        'Pixel não selecionado ou não pertence à conta.',
        oldResults,
      ),
    );

    // Vídeo (recebido = tem identificador; não processa codec)
    const mediaPassed = !!newPayload.mediaId;
    results.push(
      this.buildResult(
        'check_video', 'Upload de Vídeo', requireMediaCheck, mediaPassed,
        'Vídeo recebido pelo servidor.',
        'Arquivo de vídeo não enviado ou identificador ausente.',
        oldResults,
      ),
    );

    // Campanha e Conjuntos
    const hasName = !!newPayload.campaignName && newPayload.campaignName.trim().length > 0;
    const validCount =
      newPayload.adSetCount !== undefined &&
      Number.isInteger(newPayload.adSetCount) &&
      newPayload.adSetCount > 0;
    results.push(
      this.buildResult(
        'check_campaign', 'Configuração da Campanha', requireCampaignCheck, hasName && validCount,
        'Nome e quantidade de conjuntos válidos.',
        'Nome da campanha obrigatório e conjuntos deve ser maior que zero.',
        oldResults,
      ),
    );

    // Orçamento Diário
    const budgetPassed = newPayload.budget !== undefined && newPayload.budget > 0;
    results.push(
      this.buildResult(
        'check_budget', 'Orçamento Diário', requireBudgetCheck, budgetPassed,
        'Orçamento diário válido.',
        'Orçamento deve ser preenchido e maior que zero.',
        oldResults,
      ),
    );

    // Link de Destino
    const linkPassed = this.isValidUrl(newPayload.link);
    results.push(
      this.buildResult(
        'check_link', 'Link de Destino', requireLinkCheck, linkPassed,
        'URL de destino válida.',
        'Link de destino precisa ser uma URL absoluta válida (http/https).',
        oldResults,
      ),
    );

    // Tracking
    const isEmptyTracking = !newPayload.tracking || newPayload.tracking.trim() === '';
    const trackingPassed = !isEmptyTracking && newPayload.tracking!.includes('=');
    const trackingMessage = isEmptyTracking
      ? 'Rastreamento vazio. Aviso: Parâmetros não configurados.'
      : trackingPassed
        ? 'Parâmetros de rastreamento configurados.'
        : 'Formato de rastreamento inválido (aviso).';
    results.push(
      this.buildResult(
        'check_tracking', 'Parâmetros de Rastreamento', requireTrackingCheck, trackingPassed,
        trackingMessage, trackingMessage, oldResults, false,
      ),
    );

    return results;
  }

  private buildResult(
    id: string,
    name: string,
    isExecuted: boolean,
    passedIfExecuted: boolean,
    successMsg: string,
    errorMsg: string,
    oldResults?: CheckResult[],
    isObligatory = true,
  ): CheckResult {
    if (!isExecuted && oldResults) {
      const oldState = oldResults.find((r) => r.id === id);
      if (oldState) {
        return { ...oldState, status: CheckStatus.REUSED };
      }
    }

    return {
      id,
      name,
      status: isExecuted ? CheckStatus.EXECUTED : CheckStatus.EXECUTED,
      passed: passedIfExecuted,
      isObligatory,
      message: passedIfExecuted ? successMsg : errorMsg,
    };
  }

  private isValidUrl(link?: string): boolean {
    if (!link) return false;
    try {
      const url = new URL(link);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }
}