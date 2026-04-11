import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouteFormValue } from '../../../models/forms';

@Component({
  selector: 'app-route-form-modal',
  imports: [FormsModule],
  templateUrl: './route-form-modal.html',
  styleUrl: './route-form-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RouteFormModal {
  readonly open = input(false);
  readonly title = input('Add route');
  readonly form = input.required<RouteFormValue>();
  readonly saving = input(false);
  readonly isEditing = input(false);

  readonly close = output<void>();
  readonly submit = output<void>();
  readonly fieldChange = output<{ key: keyof RouteFormValue; value: RouteFormValue[keyof RouteFormValue] }>();

  onClose(): void {
    if (this.saving()) {
      return;
    }

    this.close.emit();
  }

  onSubmit(): void {
    this.submit.emit();
  }

  onTextFieldChange<K extends keyof RouteFormValue>(key: K, value: string): void {
    this.fieldChange.emit({ key, value: value as RouteFormValue[K] });
  }

  onNumberFieldChange<K extends keyof RouteFormValue>(key: K, value: unknown): void {
    if (value === '') {
      this.fieldChange.emit({ key, value: null as RouteFormValue[K] });
      return;
    }

    this.fieldChange.emit({ key, value: Number(value) as RouteFormValue[K] });
  }
}
