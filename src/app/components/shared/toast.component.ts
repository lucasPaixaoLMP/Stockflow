// components/shared/toast.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast {{t.type}}">
          <span>{{ icons[t.type] }}</span>
          <span>{{ t.message }}</span>
          <button (click)="toast.remove(t.id)" style="margin-left:auto;background:none;border:none;color:var(--text2);cursor:pointer;font-size:16px;">✕</button>
        </div>
      }
    </div>
  `
})
export class ToastComponent {
  toast = inject(ToastService);
  icons: Record<string,string> = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
}
