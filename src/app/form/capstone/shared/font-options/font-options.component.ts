import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-font-options',
  templateUrl: './font-options.component.html',
  styleUrls: ['./font-options.component.scss']
})
export class FontOptionsComponent implements OnInit {
  @Input() component: any;

  public fonts: Array<any> = [];

  constructor() {}

  ngOnInit() {
    this.fonts = [
      {
        value: "'Helvetica Neue', Helvetica, sans-serif",
        name: 'Arial'
      },
      {
        value: "'Courier New', Courier, 'Lucida Sans Typewriter', 'Lucida Typewriter', monospace",
        name: 'Courier New'
      },
      {
        value: "Georgia, 'Times New Roman', Times, serif",
        name: 'AriGeorgiaal'
      },
      {
        value: "'Lucida Sans Unicode', 'Lucida Grande', sans-serif",
        name: 'Lucida'
      },
      {
        value: '-apple-system, BlinkMacSystemFont, Roboto, Ubuntu, Helvetica, Arial, sans-serif;',
        name: 'Sans Serif'
      },
      {
        value: "serif, 'Times New Roman', Times",
        name: 'Serif'
      },
      {
        value: "'Times New Roman', Times, serif",
        name: 'Times New Roman'
      },
      {
        value: "'Comic Sans', 'Comic Sans MS', Chalkboard, ChalkboardSE-Regular, sans-serif",
        name: 'Comic Sans'
      },
      {
        value: 'Tahoma, Geneva, sans-serif',
        name: 'Tahoma'
      },
      {
        value: '"Trebuchet MS", Arial, Helvetica, sans-serif',
        name: 'Trebuchet'
      },
      {
        value: 'Verdana, Geneva, sans-serif',
        name: 'Verdana'
      },
      {
        value: '"Segoe UI", Segoe, "Avenir Next", "Open Sans", sans-serif',
        name: 'Segoe'
      }
    ];
  }
}
