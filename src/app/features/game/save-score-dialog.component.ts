import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ScoresService } from '../../core/services/scores.service';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  standalone: true,
  selector: 'app-save-score-dialog',
  template: `
    <h2>Save Your Score</h2>
    <form [formGroup]="form" (ngSubmit)="submit()" class="score-form">
      <mat-form-field appearance="fill">
        <mat-label>Display Name</mat-label>
        <input matInput formControlName="displayName" required />
        <mat-error *ngIf="form.controls['displayName'].invalid">
          Name is required (min 2 characters)
        </mat-error>
      </mat-form-field>

      <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">Save</button>
    </form>
  `,
  styleUrls: ['./save-score-dialog.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ]
})
export class SaveScoreDialogComponent {
  private scoresService = inject(ScoresService);
  private router = inject(Router);
  private dialogRef = inject(MatDialogRef<SaveScoreDialogComponent>);

  form: FormGroup = inject(FormBuilder).group({
    displayName: ['', [Validators.required, Validators.minLength(2)]]
  });

  score = 0; // will be passed in via dialog config if needed

  submit() {
    if (this.form.valid) {
      this.scoresService.saveScore(this.form.value.displayName, this.score).subscribe(() => {
        this.dialogRef.close();
        this.router.navigateByUrl('/');
      });
    }
  }
}
