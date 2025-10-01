// GSAP SplitText stub
// Note: SplitText is a paid GSAP plugin. This is a simplified fallback.
// For production use, you should purchase the GSAP Club GreenSock membership
// and install the actual SplitText plugin.

export class SplitText {
  lines: HTMLElement[] = [];

  constructor(element: HTMLElement | null, options?: { type?: string; wordsClass?: string }) {
    if (!element) return;

    // Create a simple line wrapper as fallback
    const text = element.textContent || '';
    element.innerHTML = '';

    // For simplicity, we'll treat the entire text as one line
    const lineEl = document.createElement('div');
    lineEl.className = options?.wordsClass || 'line';
    lineEl.textContent = text;
    lineEl.style.display = 'block';
    element.appendChild(lineEl);

    this.lines = [lineEl];
  }

  revert() {
    // Simplified revert functionality
    this.lines.forEach(line => {
      const parent = line.parentElement;
      if (parent) {
        parent.textContent = line.textContent;
      }
    });
  }
}