import { Component, ElementRef, signal, ViewChild } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  @ViewChild('editor') editor!: ElementRef;

  constructor(private sanitizer: DomSanitizer) { }

  styles = {
    bold: false,
    italic: false,
    underline: false,
    color: '#000000'
  };

  textContent = '';
  savedContent: SafeHtml[] = [];


  applyFormat(command: string, value: string | null = null) {

    this.toggleStyle(command as keyof typeof this.styles);

    document.execCommand(command, false, value ?? '');

    this.editor.nativeElement.focus();
  }



  toggleStyle(style: keyof typeof this.styles) {
    if (style !== 'color') {
      this.styles[style] = !this.styles[style];
    }
  }

  onInput(event: Event) {
    const element = event.target as HTMLElement;
    this.textContent = element.innerHTML;
  }

  save() {
    const html = this.editor.nativeElement.innerHTML.trim();
    console.log(html);

    if (html!= '') {
      const safeHtml: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(html);
      this.savedContent.push(safeHtml);
      this.resetEditor();
    }


  }

  resetEditor() {
    this.editor.nativeElement.innerHTML = '';
    this.textContent = '';
    this.styles = {
      bold: false,
      italic: false,
      underline: false,
      color: '#000000'
    };
  }

}

