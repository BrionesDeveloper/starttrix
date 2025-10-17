import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ScoresService } from '../../core/services/scores.service';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

type DialogData = { score: number };

@Component({
  standalone: true,
  selector: 'app-save-score-dialog',
  templateUrl: './save-score-dialog.component.html',
  styleUrls: ['./save-score-dialog.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
})
export class SaveScoreDialogComponent {
  private scoresService = inject(ScoresService);
  private router = inject(Router);
  private dialogRef = inject(MatDialogRef<SaveScoreDialogComponent>);
  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  form: FormGroup = inject(FormBuilder).group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
  });

  /** Puntuación mostrada; si no llega por data, cae a 0 */
  get scoreGame(): number {
    return Number(this.data?.score ?? 0);
  }

  submit() {
    if (this.form.invalid) return;

    const name = String(this.form.value.displayName || '').trim();
    this.scoresService.saveScore(name, this.scoreGame).subscribe(ok => {
      if (ok.ok) {
        this.dialogRef.close(true);
        this.router.navigateByUrl('/');
      }
    });
  }

  cancel() {
    this.dialogRef.close(false);
    this.router.navigateByUrl('/');
  }
}
