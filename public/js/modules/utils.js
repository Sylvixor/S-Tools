export class Utils {
    constructor() {
        this.typewriterTimer = null;
    }

    // Formats a file size in bytes to a human-readable string (e.g., "1.23 MB").
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    }

    // Displays a message in the status bar with a typewriter effect.
    updateStatus(message) {
        const statusEl = document.getElementById('statusText');
        if (!statusEl) return;

        clearTimeout(this.typewriterTimer);
        statusEl.textContent = '';
        
        let charIndex = 0;
        const typeChar = () => {
            if (charIndex < message.length) {
                statusEl.textContent += message.charAt(charIndex);
                charIndex++;
                this.typewriterTimer = setTimeout(typeChar, 20);
            }
        };
        typeChar();
        
        console.log(`INFO: ${message}`);
    }

    // Shows or hides the progress bar.
    showProgress(show) {
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.display = show ? 'block' : 'none';
            if (!show) {
                this.updateProgressBar(0); // Reset progress when hidden
            }
        }
    }

    // Updates the fill percentage of the progress bar.
    updateProgressBar(percent) {
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = `${percent}%`;
        }
    }

    // Copies text to the clipboard and updates the status.
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.updateStatus(`CLIPBOARD: COPIED "${text}"`);
        } catch (err) {
            console.error('ERROR: CLIPBOARD: Failed to copy.', err);
            this.updateStatus('CLIPBOARD: FAILED TO COPY');
        }
    }
}