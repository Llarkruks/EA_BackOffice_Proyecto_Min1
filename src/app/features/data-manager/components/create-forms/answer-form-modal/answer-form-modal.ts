import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AnswerFormValue } from '../../../models/forms';

@Component({
  selector: 'app-answer-form-modal',
  imports: [FormsModule],
  templateUrl: './answer-form-modal.html',
  styleUrl: './answer-form-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnswerFormModal {
  open = input(false);
  title = input('Add answer');
  form = input.required<AnswerFormValue>();
  saving = input(false);

  close = output<void>();
  submit = output<void>();
  fieldChange = output<{ key: keyof AnswerFormValue; value: AnswerFormValue[keyof AnswerFormValue] }>();

  onClose(): void {
    if (this.saving()) {
      return;
    }

    this.close.emit();
  }

  onSubmit(): void {
    this.submit.emit();
  }

  onTextFieldChange<K extends keyof AnswerFormValue>(key: K, value: string): void {
    this.fieldChange.emit({ key, value: value as AnswerFormValue[K] });
  }
}