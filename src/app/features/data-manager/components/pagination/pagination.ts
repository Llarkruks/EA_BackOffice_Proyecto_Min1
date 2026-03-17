import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  imports: [CommonModule],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css'
})
export class Pagination {
  readonly page = input<number>(1);
  readonly limit = input<number>(10);
  readonly total = input<number>(0);
  readonly totalPages = input<number>(0);

  readonly pageChange = output<number>();
  readonly limitChange = output<number>();

  readonly pageSizeOptions = [10, 25, 50];

  get canGoPrevious(): boolean {
    return this.page() > 1;
  }

  get canGoNext(): boolean {
    return this.page() < this.totalPages();
  }

  onPrevious(): void {
    if (this.canGoPrevious) {
      this.pageChange.emit(this.page() - 1);
    }
  }

  onNext(): void {
    if (this.canGoNext) {
      this.pageChange.emit(this.page() + 1);
    }
  }

  onLimitChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.limitChange.emit(value);
  }

  get startItem(): number {
    if (this.total() === 0) return 0;
    return (this.page() - 1) * this.limit() + 1;
  }

  get endItem(): number {
    return Math.min(this.page() * this.limit(), this.total());
  }
}