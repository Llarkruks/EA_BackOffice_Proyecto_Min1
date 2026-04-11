import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserFormValue } from '../../../models/forms';

@Component({
  selector: 'app-user-form-modal',
  imports: [FormsModule],
  templateUrl: './user-form-modal.html',
  styleUrl: './user-form-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserFormModal {
  readonly open = input(false);
  readonly title = input('Add user');
  readonly form = input.required<UserFormValue>();
  readonly saving = input(false);
  readonly isEditing = input(false);

  readonly close = output<void>();
  readonly submit = output<void>();
  readonly fieldChange = output<{ key: keyof UserFormValue; value: UserFormValue[keyof UserFormValue] }>();

  onClose(): void {
    if (this.saving()) {
      return;
    }

    this.close.emit();
  }

  onSubmit(): void {
    this.submit.emit();
  }

  onFieldChange<K extends keyof UserFormValue>(key: K, value: UserFormValue[K]): void {
    this.fieldChange.emit({ key, value });
  }
}
