import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PointFormValue } from '../../../models/forms';

@Component({
  selector: 'app-point-form-modal',
  imports: [FormsModule],
  templateUrl: './point-form-modal.html',
  styleUrl: './point-form-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PointFormModal {
  open = input(false);
  title = input('Add point');
  form = input.required<PointFormValue>();
  saving = input(false);
  isEditing = input(false);

  close = output<void>();
  submit = output<void>();
  fieldChange = output<{ key: keyof PointFormValue; value: PointFormValue[keyof PointFormValue] }>();

  onClose(): void {
    if (this.saving()) {
      return;
    }

    this.close.emit();
  }

  onSubmit(): void {
    this.submit.emit();
  }

  onTextFieldChange<K extends keyof PointFormValue>(key: K, value: string): void {
    this.fieldChange.emit({ key, value: value as PointFormValue[K] });
  }

  onNumberFieldChange<K extends keyof PointFormValue>(key: K, value: unknown): void {
    if (value === '') {
      this.fieldChange.emit({ key, value: null as PointFormValue[K] });
      return;
    }

    this.fieldChange.emit({ key, value: Number(value) as PointFormValue[K] });
  }
}
