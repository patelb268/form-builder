import { HttpClient } from '@angular/common/http';
import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-uploader',
  templateUrl: './uploader.component.html',
  styleUrls: ['./uploader.component.scss'],
})
export class UploaderComponent implements OnInit {
  @Input() component: any;
  @Input() formDesign: any;
  fileToUpload: File = null;
  uploading: boolean = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {}


  onFileSelected(event) {
    this.fileToUpload = event.target.files[0];
  }

  onUpload() {
    if (this.fileToUpload) {
      this.uploading = true;
      const formData: FormData = new FormData();
      formData.append('fileKey', this.fileToUpload, this.fileToUpload.name);
      this.http.post('https://your-api-endpoint.com/upload', formData)
        .subscribe(() => {
          this.uploading = false;
        }, error => {
          console.error(error);
          this.uploading = false;
          
        });
    }
  }
}
