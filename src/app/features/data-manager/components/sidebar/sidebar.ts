import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemType, ItemTypeOption } from '../../../../core/models/items';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  readonly selectedType = input.required<ItemType>();
  readonly types = input.required<ItemTypeOption[]>();

  readonly typeChange = output<ItemType>();

  selectType(type: ItemType): void {
    this.typeChange.emit(type);
  }
}