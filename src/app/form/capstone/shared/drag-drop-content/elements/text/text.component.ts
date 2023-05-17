import { Component, OnInit, Input, ViewChild, AfterViewInit } from '@angular/core';
import { CKEditorComponent } from 'ngx-ckeditor';
import { MatCardModule } from '@angular/material/card';
import { MatCardContent } from '@angular/material/card';

@Component({
  selector: 'app-text',
  templateUrl: './text.component.html',
  styleUrls: ['./text.component.scss'],
})
export class TextComponent implements OnInit {
  @ViewChild('ckEditor') ckEditor: any;
  @Input() component: any;
  public currentLanguage: string = '';
  public editorConfig: any = {
    toolbarGroups: [
      { name: 'basicstyles', groups: ['basicstyles', 'cleanup'] },
      { name: 'paragraph', groups: ['align', 'list', 'indent'] },
      { name: 'styles', groups: ['styles'] },
      { name: 'colors', groups: ['colors'] },
      { name: 'insert', groups: ['insert'] },
      { name: 'links', groups: ['links'] },
    ],
    removeButtons:
      'Source,Save,Templates,NewPage,ExportPdf,Preview,Print,Cut,Undo,Redo,Copy,Paste,PasteText,PasteFromWord,Find,SelectAll,Replace,Scayt,Form,Checkbox,Radio,TextField,Textarea,Select,Button,HiddenField,Strike,Superscript,Subscript,BidiLtr,BidiRtl,Language,CreateDiv,Blockquote,Anchor,Unlink,Image,Flash,HorizontalRule,Smiley,SpecialChar,PageBreak,Iframe,ShowBlocks,About,Maximize,ImageButton',
    height: '65vh',
  };

  constructor(){}

  ngOnInit() {}
}
