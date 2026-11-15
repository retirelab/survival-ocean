/** DOM controls stay interactive while Phaser's entire scene is paused. */
export class PauseControls {
  private root = document.createElement('div');
  private panel = document.createElement('div');
  private status = document.createElement('p');
  private pauseButton = document.createElement('button');
  private paused = false;
  private active = false;
  private onKey = (event: KeyboardEvent) => {
    if (event.repeat || !this.active || !['Escape', 'KeyP'].includes(event.code)) return;
    event.preventDefault();
    if (this.paused) this.resume(); else this.pause();
  };
  private onVisibility = () => { if (document.hidden) this.pause(); };
  private onBlur = () => this.pause();

  constructor(private handlers: { pause: () => void; resume: () => void; save: () => boolean }) {
    this.root.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:10;font-family:system-ui,sans-serif;color:white';
    this.pauseButton = this.button('⏸ 일시정지', () => this.pause());
    this.pauseButton.style.cssText += ';position:absolute;right:max(12px,env(safe-area-inset-right));top:max(12px,env(safe-area-inset-top));pointer-events:auto';
    this.panel.style.cssText = 'position:absolute;inset:0;background:rgba(2,6,23,.92);display:none;align-items:center;justify-content:center;pointer-events:auto;padding:16px;box-sizing:border-box';
    this.panel.setAttribute('role', 'dialog');
    this.panel.setAttribute('aria-modal', 'true');
    this.panel.setAttribute('aria-label', '일시정지');
    const card = document.createElement('div');
    card.style.cssText = 'width:100%;max-width:360px;max-height:100%;overflow:auto;text-align:center';
    const title = document.createElement('h2');
    title.textContent = '⏸ 일시정지';
    const hint = document.createElement('p');
    hint.textContent = '같은 기기·브라우저에서 이어할 수 있어요.\n레벨·강화·가방·광물·보스 상태가 저장돼요.\n이어할 때 물고기는 다시 배치되고 총알은 사라져요.\n브라우저 데이터를 지우면 저장도 삭제돼요.';
    hint.style.cssText = 'font-size:13px;line-height:1.7;color:#cbd5e1;white-space:pre-line';
    const resume = this.button('▶ 계속하기', () => this.resume());
    const save = this.button('💾 저장하기', () => this.save());
    const saveResume = this.button('💾 저장 후 계속하기', () => { if (this.save()) this.resume(); });
    for (const b of [resume, save, saveResume]) b.style.cssText += ';display:block;width:100%;margin:12px 0;min-height:48px';
    this.status.setAttribute('role', 'status');
    this.status.style.cssText = 'font-size:14px;line-height:1.6;min-height:44px;white-space:pre-line';
    card.append(title, resume, save, saveResume, this.status, hint);
    this.panel.append(card);
    this.root.append(this.pauseButton, this.panel);
    document.body.append(this.root);
    window.addEventListener('keydown', this.onKey);
    document.addEventListener('visibilitychange', this.onVisibility);
    window.addEventListener('blur', this.onBlur);
    this.setActive(false);
  }

  private button(label: string, action: () => void) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.style.cssText = 'border:2px solid #7dd3fc;border-radius:12px;background:#075985;color:white;padding:10px 16px;font-size:15px;font-weight:bold;cursor:pointer;touch-action:manipulation';
    button.addEventListener('click', action);
    return button;
  }

  setActive(active: boolean) { this.active = active; this.pauseButton.hidden = !active; }

  pause() {
    if (!this.active || this.paused) return;
    this.paused = true;
    this.handlers.pause();
    this.panel.style.display = 'flex';
    this.status.textContent = '게임 시간이 멈췄어요. 저장하려면 저장하기 버튼을 누르세요.';
    (this.panel.querySelector('button') as HTMLButtonElement).focus({ preventScroll: true });
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;
    this.panel.style.display = 'none';
    this.handlers.resume();
    this.pauseButton.blur();
    (document.activeElement as HTMLElement | null)?.blur();
  }

  private save() {
    const saved = this.handlers.save();
    this.status.textContent = saved ? `✅ 저장 완료 (${new Date().toLocaleTimeString('ko-KR')})` : '저장하지 못했어요. 브라우저 저장 공간과 설정을 확인하고 다시 시도하세요.';
    return saved;
  }

  destroy() {
    window.removeEventListener('keydown', this.onKey);
    document.removeEventListener('visibilitychange', this.onVisibility);
    window.removeEventListener('blur', this.onBlur);
    this.root.remove();
  }
}
