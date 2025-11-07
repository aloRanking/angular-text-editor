import { Component, ElementRef, signal, ViewChild, ViewEncapsulation } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  encapsulation: ViewEncapsulation.None,
  
})
export class App {
  @ViewChild('editor') editor!: ElementRef;
  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;

  constructor(private sanitizer: DomSanitizer) { }

  styles = {
    bold: false,
    italic: false,
    underline: false,
    color: '#000000'
  };

  textContent = '';
  //savedContent: SafeHtml[] = [];

  

  savedContent: { html: string, images: string[] }[] = [];

  uploadImage() {
    this.imageInput.nativeElement.click();
  }

 onImageSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  for (const file of Array.from(input.files)) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.style.maxWidth = '100px';
      img.style.height = '100px';
      img.style.borderRadius = '6px';
      img.style.margin = '5px';
      this.editor.nativeElement.appendChild(img);
    };
    reader.readAsDataURL(file);
  }

  input.value = ''; 
}

  insertImageAtCursor(img: HTMLImageElement) {
    const sel = window.getSelection();
    if (!sel?.rangeCount) return;
    const range = sel.getRangeAt(0);
    range.insertNode(img);
    range.collapse(false);
  }

 onKeyDown(event: KeyboardEvent) {
  // Check if Enter key was pressed
  if (event.key === 'Enter') {
    event.preventDefault();

   
    document.execCommand('insertHTML', false, '<br><br>');
  }
}


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

    if (html != '') {

const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

   
    const images = Array.from(tempDiv.querySelectorAll('img')).map(img => img.src);

    // Remove <img> tags from the text HTML
    tempDiv.querySelectorAll('img').forEach(img => img.remove());
    const textOnlyHtml = tempDiv.innerHTML;

    
    this.savedContent.push({ html: textOnlyHtml, images });
      
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

// applyFormat(command: string, value: string | null = null) {
//   this.toggleStyle(command as keyof typeof this.styles);
//   this.applyModernCommand(command, value);
//   this.editor.nativeElement.focus();
// }

// applyModernCommand(command: string, value: string | null = null) {
//   const selection = window.getSelection();
//   if (!selection || selection.rangeCount === 0) return;

//   const range = selection.getRangeAt(0);
//   const selectedText = range.extractContents();

//   let formattedNode: HTMLElement;

//   switch (command) {
//     case 'bold':
//       formattedNode = document.createElement('strong');
//       break;
//     case 'italic':
//       formattedNode = document.createElement('em');
//       break;
//     case 'underline':
//       formattedNode = document.createElement('u');
//       break;
//     case 'foreColor':
//       formattedNode = document.createElement('span');
//       formattedNode.style.color = value || this.styles.color;
//       break;
//     default:
//       return;
//   }

//   formattedNode.appendChild(selectedText);
//   range.insertNode(formattedNode);
// }

  

}

