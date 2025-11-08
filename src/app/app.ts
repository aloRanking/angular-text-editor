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
  isSaving = false;

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

 async save() {
  const html = this.editor.nativeElement.innerHTML.trim();
  if (!html) return;

  this.isSaving = true; // start feedback

  try {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const images = Array.from(tempDiv.querySelectorAll('img')).map(img => img.src);
    tempDiv.querySelectorAll('img').forEach(img => img.remove());

    let textOnlyHtml = tempDiv.innerHTML;

    // Transform Quran references in the text-only HTML
    textOnlyHtml = await this.linkifyQuranRefsInHtml(textOnlyHtml);

    this.savedContent.push({ html: textOnlyHtml, images });
    this.resetEditor();
  } catch (err) {
    console.error('Error while saving:', err);
  } finally {
    this.isSaving = false; // end feedback
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

  private async fetchVersePreview(chapter: string, verse: string): Promise<string | null> {
    try {
      const res = await fetch(`http://api.alquran.cloud/v1/ayah/${chapter}:${verse}/en.asad`);
      console.log(res);
      const data = await res.json();
      console.log('data: ', data);

      // Access the text from data.data.text instead of data.text
      if (data?.data?.text?.length > 0) {
        const text = data.data.text;
        console.log(text);
        return text.length > 100 ? text.slice(0, 80) + '…' : text;
      }
      return null;
    } catch (err) {
      console.error('Error fetching verse preview:', err);
      return null;
    }
  }

  private generateQuranThumbDataUrl(verse: string): string {
    const text = `${verse}`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80">
    <rect rx="8" ry="8" width="100%" height="100%" fill="#fffbea" stroke="#f1c40f"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="end"
          font-family="Arial, Helvetica, sans-serif" font-size="10" fill="#333">${text}</text>
  </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  /**
   * Walk text nodes and replace Qx:y occurrences with anchor+img nodes.
   * Returns transformed HTML string.
   */
  async linkifyQuranRefsInHtml(html: string): Promise<string> {
    const temp = document.createElement('div');
    temp.innerHTML = html;

    const regex = /\b[qQ](\d{1,3}):(\d{1,3})\b/g;

    const walk = async (node: Node): Promise<void> => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue || '';
        let match: RegExpExecArray | null;
        let lastIndex = 0;
        const frag = document.createDocumentFragment();
        regex.lastIndex = 0;

        while ((match = regex.exec(text)) !== null) {
          const before = text.slice(lastIndex, match.index);
          if (before) frag.appendChild(document.createTextNode(before));

          const chapter = match[1];
          const verse = match[2];

          const preview = await this.fetchVersePreview(chapter, verse);

          const anchor = document.createElement('a');
          anchor.className = 'q-ref';
          anchor.href = `https://quran.com/${chapter}/${verse}`;
          anchor.target = '_blank';
          anchor.rel = 'noopener noreferrer';
          anchor.setAttribute('data-chapter', chapter);
          anchor.setAttribute('data-verse', verse);

          // Display format: "Q2:7 — Allah has set a seal..."
          const label = `Q${chapter}:${verse}`;
          const previewText = preview ? ` — ${preview}` : '';
          anchor.textContent = label + previewText;;
          const thumbText = label + previewText;
          // const img = document.createElement('img');
          // img.className = 'q-thumb';
          // img.src = this.generateQuranThumbDataUrl(thumbText);
          // img.alt = `Q${chapter}:${verse}`;
          // anchor.appendChild(img);

          frag.appendChild(anchor);
          lastIndex = regex.lastIndex;
        }

        const rest = text.slice(lastIndex);
        if (rest) frag.appendChild(document.createTextNode(rest));
        if (frag.childNodes.length) node.parentNode?.replaceChild(frag, node);
        return;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        if (el.closest && el.closest('.q-ref')) return;
        const skipTags = ['A', 'SCRIPT', 'STYLE'];
        if (skipTags.includes(el.tagName)) return;
        for (const child of Array.from(node.childNodes)) {
          await walk(child);
        }
      }
    };

    await walk(temp);
    return temp.innerHTML;
  }





}

