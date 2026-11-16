import { SUBMARINES, getSubmarine, submarineImage, type FleetState } from './Submarines.js';

export class SubmarinePanel {
  private root = document.createElement('div');
  private equipment = document.createElement('div');
  private preview = document.createElement('img');
  private grade = document.createElement('div');
  private name = document.createElement('div');
  private shopButton = document.createElement('button');
  private modal = document.createElement('div');
  private balance = document.createElement('p');
  private list = document.createElement('div');
  private message = document.createElement('p');
  private closeButton = document.createElement('button');
  private open = false;
  private signature = '';
  private state: FleetState;
  private onKey = (event: KeyboardEvent) => {
    if (!this.open) return;
    if (event.code === 'Escape') { event.preventDefault(); this.close(); }
    if (event.code === 'Tab') {
      const buttons = Array.from(this.modal.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
      const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
      const next = event.shiftKey ? (current <= 0 ? buttons.length - 1 : current - 1) : (current + 1) % buttons.length;
      event.preventDefault(); buttons[next]?.focus();
    }
  };

  constructor(state: FleetState, private handlers: {
    open: () => boolean; close: () => void; select: (id: string) => string | null;
  }) {
    this.state = state;
    this.root.style.cssText = 'position:fixed;inset:0;z-index:9;pointer-events:none;font-family:system-ui,sans-serif;color:#e0f2fe';
    const style = document.createElement('style');
    style.textContent = `
      .ocean-fleet-card{position:absolute;right:max(12px,env(safe-area-inset-right));top:max(12px,env(safe-area-inset-top));width:112px;height:108px;box-sizing:border-box;padding:3px 6px 6px;border:2px solid #38bdf8;border-radius:13px;background:#082f49ed;text-align:center;pointer-events:auto}
      .ocean-fleet-card img{display:block;width:96px;height:58px;margin:0 auto;object-fit:contain}
      .ocean-fleet-card div{font-size:12px;line-height:18px;font-weight:bold}
      .ocean-shop-button{position:absolute;right:calc(max(12px,env(safe-area-inset-right)) + 124px);top:max(12px,env(safe-area-inset-top));width:52px;height:60px;pointer-events:auto}
      .ocean-shop-modal{position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:#020617ed;padding:16px;box-sizing:border-box;pointer-events:auto;touch-action:pan-y}
      .ocean-shop-card{max-width:640px;width:100%;max-height:100%;overflow:auto;overscroll-behavior:contain;padding:18px;box-sizing:border-box;border:1px solid #155e75;border-radius:18px;background:#082338;touch-action:pan-y}
      .ocean-shop-card h2{font-size:22px;margin:0 0 8px}.ocean-shop-card p{line-height:1.6;font-size:13px}
      .ocean-shop-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .ocean-shop-item{border:1px solid #334155;background:#0f172a;padding:12px;border-radius:12px;text-align:center}
      .ocean-shop-item img{width:100%;max-width:150px;height:76px;object-fit:contain}.ocean-shop-item h3{font-size:15px;margin:4px 0}
      .ocean-shop-item button{width:100%;min-height:44px;margin-top:8px}.ocean-shop-item button:disabled{opacity:.5;cursor:default}
      .ocean-fleet-button{font:700 13px system-ui,sans-serif;border:2px solid #67e8f9;border-radius:11px;color:white;background:#0f766e;padding:6px;cursor:pointer;white-space:pre-line;touch-action:manipulation}
      @media(max-width:360px){.ocean-shop-card{padding:12px}.ocean-shop-list{gap:8px}.ocean-shop-item{padding:8px}}
    `;
    this.equipment.className = 'ocean-fleet-card';
    this.equipment.setAttribute('aria-label', '현재 잠수함');
    this.equipment.append(this.preview, this.grade, this.name);
    this.shopButton.className = 'ocean-fleet-button ocean-shop-button';
    this.shopButton.type = 'button'; this.shopButton.textContent = '🏠\n상점';
    this.shopButton.setAttribute('aria-label', '잠수함 상점');
    this.shopButton.onclick = () => this.show();
    this.modal.className = 'ocean-shop-modal';
    this.modal.setAttribute('role', 'dialog'); this.modal.setAttribute('aria-modal', 'true'); this.modal.setAttribute('aria-label', '잠수함 상점');
    const card = document.createElement('div'); card.className = 'ocean-shop-card';
    const heading = document.createElement('h2'); heading.textContent = '🏠 잠수함 상점';
    const guide = document.createElement('p'); guide.textContent = '물고기를 수조에 넣으면 1마리당 10코인! 보유 잠수함은 무료로 교체할 수 있어요. 구매·장착 즉시 저장됩니다.';
    this.list.className = 'ocean-shop-list';
    this.message.setAttribute('role', 'status'); this.message.style.cssText = 'min-height:24px;color:#fde047';
    this.closeButton.className = 'ocean-fleet-button'; this.closeButton.type = 'button'; this.closeButton.textContent = '닫고 계속하기'; this.closeButton.style.cssText = 'width:100%;min-height:46px'; this.closeButton.onclick = () => this.close();
    card.append(heading, this.balance, guide, this.list, this.message, this.closeButton);
    this.modal.append(card); this.root.append(style, this.equipment, this.shopButton, this.modal);
    document.body.append(this.root); window.addEventListener('keydown', this.onKey);
    this.update(state); this.setActive(false);
  }
  setActive(active: boolean) { this.root.hidden = !active; }
  update(state: FleetState) {
    this.state = state;
    const signature = JSON.stringify(state);
    if (signature === this.signature) return;
    this.signature = signature;
    const sub = getSubmarine(state.equipped);
    this.preview.src = submarineImage(sub); this.preview.alt = sub.name;
    this.grade.textContent = sub.grade; this.grade.style.color = sub.color;
    this.name.textContent = sub.name;
    this.balance.textContent = `🪙 보유 코인 ${state.coins.toLocaleString()}`;
    if (this.open) this.renderItems();
  }
  private show() {
    if (this.open || !this.handlers.open()) return;
    this.open = true; this.modal.style.display = 'flex'; this.message.textContent = '';
    this.renderItems(); this.closeButton.focus({ preventScroll: true });
  }
  private renderItems() {
    this.list.replaceChildren();
    for (const sub of SUBMARINES) {
      const item = document.createElement('div'); item.className = 'ocean-shop-item';
      const image = document.createElement('img'); image.src = submarineImage(sub); image.alt = sub.name;
      const grade = document.createElement('div'); grade.textContent = sub.grade; grade.style.color = sub.color;
      const name = document.createElement('h3'); name.textContent = sub.name;
      const stats = document.createElement('p'); stats.textContent = sub.speed === 1 ? '기본 이동 속도' : `이동 속도 +${Math.round((sub.speed - 1) * 100)}%`;
      const price = document.createElement('p'); price.textContent = sub.price === 0 ? '처음부터 보유' : `🪙 ${sub.price.toLocaleString()}코인`;
      const equipped = this.state.equipped === sub.id; const owned = this.state.owned.includes(sub.id);
      const button = document.createElement('button'); button.type = 'button'; button.className = 'ocean-fleet-button';
      button.textContent = equipped ? '탑승 중' : owned ? '탑승하기' : '구매 후 탑승';
      button.disabled = equipped || (!owned && this.state.coins < sub.price);
      button.onclick = () => {
        const error = this.handlers.select(sub.id);
        this.message.textContent = error ?? `✅ ${sub.name} 탑승 완료! 저장됐어요.`;
        this.renderItems(); this.closeButton.focus({ preventScroll: true });
      };
      item.append(image, grade, name, stats, price, button); this.list.append(item);
    }
  }
  private close() {
    if (!this.open) return;
    this.open = false; this.modal.style.display = 'none'; this.handlers.close(); this.shopButton.focus({ preventScroll: true });
  }
  destroy() { window.removeEventListener('keydown', this.onKey); this.root.remove(); }
}
