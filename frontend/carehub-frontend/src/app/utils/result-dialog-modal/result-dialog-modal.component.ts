import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ResultDialogData } from '@app/core/models/dialog-data.model';

@Component({
  selector: 'app-result-dialog-modal',
  templateUrl: './result-dialog-modal.component.html',
  styleUrls: ['./result-dialog-modal.component.scss']
})
export class ResultDialogModalComponent {
  constructor(
    public dialogRef: MatDialogRef<ResultDialogModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ResultDialogData
  ) {}

  chiudiDialog(): void {
    this.dialogRef.close();
  }
}
