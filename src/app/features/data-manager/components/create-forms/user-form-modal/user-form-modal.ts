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
  open = input(false);
  title = input('Add user');
  form = input.required<UserFormValue>();
  saving = input(false);
  isEditing = input(false);

  close = output<void>();
  submit = output<void>();
  fieldChange = output<{ key: keyof UserFormValue; value: UserFormValue[keyof UserFormValue] }>();

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
