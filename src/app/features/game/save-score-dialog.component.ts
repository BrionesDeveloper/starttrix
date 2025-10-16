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
  templateUrl: './save-score-dialog.component.html',
  styleUrls: ['./save-score-dialog.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule]
})
export class SaveScoreDialogComponent {
  private scoresService = inject(ScoresService);
  private router = inject(Router);
  private dialogRef = inject(MatDialogRef<SaveScoreDialogComponent>);

  form: FormGroup = inject(FormBuilder).group({
    displayName: ['', [Validators.required, Validators.minLength(2)]]
  });

  score = 0;

  submit() {
    if (this.form.valid) {
      const name = String(this.form.value.displayName || '').trim();
      this.scoresService.saveScore(name, this.score).subscribe(() => {
        this.dialogRef.close(true);
        this.router.navigateByUrl('/');
      });
    }
  }

  cancel() { this.dialogRef.close(false); }
}
