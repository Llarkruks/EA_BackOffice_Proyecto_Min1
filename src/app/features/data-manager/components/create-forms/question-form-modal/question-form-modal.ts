import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QuestionFormValue } from '../../../models/forms';

@Component({
  selector: 'app-question-form-modal',
  imports: [FormsModule],
  templateUrl: './question-form-modal.html',
  styleUrl: './question-form-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuestionFormModal {
  open = input(false);
  title = input('Add question');
  form = input.required<QuestionFormValue>();
  saving = input(false);
  isEditing = input(false);

  close = output<void>();
  submit = output<void>();
  fieldChange = output<{ key: keyof QuestionFormValue; value: QuestionFormValue[keyof QuestionFormValue] }>();

  onClose(): void {
    if (this.saving()) {
      return;
    }

    this.close.emit();
  }

  onSubmit(): void {
    this.submit.emit();
  }

  onTextFieldChange<K extends keyof QuestionFormValue>(key: K, value: string): void {
    this.fieldChange.emit({ key, value: value as QuestionFormValue[K] });
  }
}