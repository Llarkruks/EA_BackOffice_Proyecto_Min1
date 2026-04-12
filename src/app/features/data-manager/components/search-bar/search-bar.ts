import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-search-bar',
  imports: [],
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchBar {
  placeholder = input('Search...');
  value = input('');
  searching = input(false);

  valueChange = output<string>();

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.valueChange.emit(target.value);
  }

  clear(): void {
    this.valueChange.emit('');
  }
}
