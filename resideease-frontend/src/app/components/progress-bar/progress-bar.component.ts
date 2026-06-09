import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ProgressStep {
  label: string;
  route: string;
}

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-bar.component.html',
  styleUrl: './progress-bar.component.scss'
})
export class ProgressBarComponent {
  @Input() steps: ProgressStep[] = [];
  @Input() currentStep = 0;

  isCompleted(index: number): boolean { return index < this.currentStep; }
  isActive(index: number): boolean { return index === this.currentStep; }
  isPending(index: number): boolean { return index > this.currentStep; }
}
