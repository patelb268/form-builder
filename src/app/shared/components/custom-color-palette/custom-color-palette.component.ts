import {
  Component,
  OnInit,
  Renderer2,
  ElementRef,
  ViewChild,
  EventEmitter,
  Input,
  Output,
} from "@angular/core";
import { FormControl } from "@angular/forms";

@Component({
  selector: "app-custom-color-palette",
  templateUrl: "./custom-color-palette.component.html",
  styleUrls: ["./custom-color-palette.component.scss"],
})
export class CustomColorPaletteComponent implements OnInit {
  @Input("colorControl") colorControl = new FormControl();
  @Input() bgColor;
  @Input() label;
  showColorPalette = false;
  selectedColor = "#000000";
  colorPalleteColors = [
    { hexCode: "FFFFFF", colorName: "white" },
    { hexCode: "#FFF5EE", colorName: "seashell" },
    { hexCode: "#FFF8DC", colorName: "cornsilk" },
    { hexCode: "#fffacd ", colorName: "lemmon chiffon" },
    { hexCode: "#FFFFE0", colorName: "light yellow" },
    { hexCode: "#98FB98", colorName: "pale green" },
    { hexCode: "#30D5C8", colorName: "pale turquoise" },
    { hexCode: "#E0FFFF", colorName: "light cyan" },
    { hexCode: "#E6E6FA", colorName: "lavender" },
    { hexCode: "#DDA0DD", colorName: "plum" },
    { hexCode: "#D3D3D3", colorName: "light gray" },
    { hexCode: "#FFC0CB", colorName: "pink" },
    { hexCode: "#F2D2BD", colorName: "bisque" },
    { hexCode: "#ffe4b5 ", colorName: "moccasin" },
    { hexCode: "#F0E68C", colorName: "khaki" },
    { hexCode: "#90EE90", colorName: "light green" },
    { hexCode: "#20b2aa ", colorName: "light sea green" },
    { hexCode: "#87cefa", colorName: "light sky blue" },
    { hexCode: "#6495ED", colorName: "cornflower blue" },
    { hexCode: "#da53ee", colorName: "violet" },
    { hexCode: "#C0C0C0", colorName: "silve" },
    { hexCode: "#f08080", colorName: "light coral" },
    { hexCode: "#F4A460", colorName: "sandy brown" },
    { hexCode: "#FFA500", colorName: "orange" },
    { hexCode: "#DAA520", colorName: "pale goldenrod" },
    { hexCode: "#DFFF00", colorName: "chartreuse" },
    { hexCode: "#48d1cc ", colorName: "medium turquoise" },
    { hexCode: "#87CEEB", colorName: "sky blue" },
    { hexCode: "#7b68ee ", colorName: "medium slate blue" },
    { hexCode: "#DA70D6", colorName: "orchid" },
    { hexCode: "#808080", colorName: "gray" },
    { hexCode: "#FF0000", colorName: "red" },
    { hexCode: "#ff5349", colorName: "orange red" },
    { hexCode: "#8B4000", colorName: "dark orange" },
    { hexCode: "#FFFF00", colorName: "yellow" },
    { hexCode: "#32CD32", colorName: "lime green" },
    { hexCode: "#8fbc8f ", colorName: "dark sea green" },
    { hexCode: "#4169e1", colorName: "royal blue" },
    { hexCode: "#6A5ACD", colorName: "slate blue" },
    { hexCode: "#ba55d3 ", colorName: "medium orchid" },
    { hexCode: "#696969", colorName: "dim gray" },
    { hexCode: "#DC143C", colorName: "crimson" },
    { hexCode: "#7B3F00", colorName: "chocolate" },
    { hexCode: "#FF7F50", colorName: "coral" },
    { hexCode: "#FFD700", colorName: "gold" },
    { hexCode: "#228B22", colorName: "forest green" },
    { hexCode: "#93E9BE", colorName: "sea green" },
    { hexCode: "#0000FF", colorName: "blue" },
    { hexCode: "#8A2BE2", colorName: "blue-violet" },
    { hexCode: "#9932cc", colorName: "dark orchid" },
    { hexCode: "#2F4F4F", colorName: "dark slate gray" },
    { hexCode: "#b22222", colorName: "fire brick" },
    { hexCode: "#8B4513", colorName: "saddle brown" },
    { hexCode: "#A0522D", colorName: "sienna" },
    { hexCode: "#808000", colorName: "olive" },
    { hexCode: "#00FF00", colorName: "green" },
    { hexCode: "#008B8B", colorName: "dark cyan" },
    { hexCode: "#0000cd", colorName: "medium blue" },
    { hexCode: "#483D8B", colorName: "dark slate blue" },
    { hexCode: "#8b008b", colorName: "dark magenta" },
    { hexCode: "#000000", colorName: "black" },
    { hexCode: "#8B0000", colorName: "dark red" },
    { hexCode: "#800000", colorName: "maroon" },
    { hexCode: "#964B00", colorName: "brown" },
    { hexCode: "#556B2F", colorName: "dark olive green" },
    { hexCode: "#013220", colorName: "dark green" },
    { hexCode: "#191970", colorName: "midnight blue" },
    { hexCode: "#000080", colorName: "navy" },
    { hexCode: "#4B0082", colorName: "indigo" },
    { hexCode: "#A020F0", colorName: "purple" },
  ];
  @ViewChild("menu") menu: ElementRef;
  @Output() bgColorChange = new EventEmitter<string>();
  @ViewChild("toggleButton") toggleButton: ElementRef;
  constructor(private renderer: Renderer2) {
    // this.renderer.listen('window', 'click', (e: Event) => {
    // 	/**
    // 	 * Only run when toggleButton is not clicked
    // 	 * If we don't check this, all clicks (even on the toggle button) gets into this
    // 	 * section which in the result we might never see the menu open!
    // 	 * And the menu itself is checked here, and it's where we check just outside of
    // 	 * the menu and button the condition abbove must close the menu
    // 	 */
    // 	if (
    // 		e.target !== this.toggleButton.nativeElement &&
    // 		e.target !== this.menu?.nativeElement
    // 	) {
    // 		this.showColorPalette = false;
    // 	}
    // });
  }

  ngOnInit(): void {
    this.selectedColor = this.colorControl.value;
  }

  openColorPalette() {
    this.showColorPalette = !this.showColorPalette;
  }

  selectColor(item: any) {
    this.showColorPalette = false;
    this.selectedColor = item.hexCode;
    this.colorControl.setValue(this.selectedColor);
    this.bgColorChange.emit(this.selectedColor);
  }
}
