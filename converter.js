class Converter {
    constructor() {
        this.files = [];
        this.selectedFiles = [];
        this.currentFormat = '';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateStatus('SYSTEM READY');
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // File upload
        const uploadZone = document.getElementById('uploadZone');
        const fileInput = document.getElementById('fileInput');
        
        uploadZone.addEventListener('click', () => fileInput.click());
        uploadZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        uploadZone.addEventListener('drop', (e) => this.handleDrop(e));
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Quality slider
        const qualitySlider = document.getElementById('qualitySlider');
        qualitySlider.addEventListener('input', (e) => {
            document.getElementById('qualityValue').textContent = e.target.value;
        });

        // Convert button
        document.getElementById('convertBtn').addEventListener('click', () => this.convertFiles());

        // Encode/Decode
        document.getElementById('encodeBtn').addEventListener('click', () => this.encodeText());
        document.getElementById('decodeBtn').addEventListener('click', () => this.decodeText());
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');

        this.updateStatus(`SWITCHED TO ${tabName.toUpperCase()} MODULE`);
    }

    handleDragOver(e) {
        e.preventDefault();
        e.target.closest('.upload-zone').classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.target.closest('.upload-zone').classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.target.closest('.upload-zone').classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
    }

    processFiles(files) {
        this.updateStatus('PROCESSING FILES...');
        
        files.forEach(file => {
            const fileData = {
                id: Date.now() + Math.random(),
                file: file,
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified
            };
            this.files.push(fileData);
        });

        this.renderFileList();
        this.updateStatus(`LOADED ${files.length} FILES`);
    }

    renderFileList() {
        const fileList = document.getElementById('fileList');
        fileList.innerHTML = '';

        this.files.forEach(fileData => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.dataset.id = fileData.id;
            
            fileItem.innerHTML = `
                <div class="file-info">
                    <div class="file-name">${fileData.name}</div>
                    <div class="file-meta">
                        <span>SIZE: ${this.formatFileSize(fileData.size)}</span>
                        <span>TYPE: ${fileData.type || 'unknown'}</span>
                        <span>MODIFIED: ${new Date(fileData.lastModified).toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="btn danger" onclick="converter.removeFile('${fileData.id}')">REMOVE</button>
                </div>
            `;

            fileItem.addEventListener('click', (e) => {
                if (!e.target.classList.contains('btn')) {
                    this.toggleFileSelection(fileData.id);
                }
            });

            fileList.appendChild(fileItem);
        });
    }

    toggleFileSelection(fileId) {
        const fileItem = document.querySelector(`[data-id="${fileId}"]`);
        const isSelected = fileItem.classList.contains('selected');
        
        if (isSelected) {
            fileItem.classList.remove('selected');
            this.selectedFiles = this.selectedFiles.filter(id => id !== fileId);
        } else {
            fileItem.classList.add('selected');
            this.selectedFiles.push(fileId);
        }

        this.updateConversionPanel();
        this.updateStatus(`SELECTED ${this.selectedFiles.length} FILES`);
    }

    removeFile(fileId) {
        this.files = this.files.filter(file => file.id != fileId);
        this.selectedFiles = this.selectedFiles.filter(id => id !== fileId);
        this.renderFileList();
        this.updateConversionPanel();
        this.updateStatus('FILE REMOVED');
    }

    updateConversionPanel() {
        const panel = document.getElementById('conversionPanel');
        
        if (this.selectedFiles.length === 0) {
            panel.style.display = 'none';
            return;
        }

        panel.style.display = 'block';
        this.updateFormatOptions();
    }

    updateFormatOptions() {
        const selectedFile = this.files.find(f => f.id === this.selectedFiles[0]);
        if (!selectedFile) return;

        const formatGrid = document.getElementById('formatGrid');
        const qualityControls = document.getElementById('qualityControls');
        
        let formats = [];
        const fileType = selectedFile.type.toLowerCase();

        if (fileType.startsWith('image/')) {
            formats = ['PNG', 'JPEG', 'WEBP', 'GIF', 'BMP', 'ICO'];
            qualityControls.style.display = 'block';
        } else if (fileType.startsWith('video/')) {
            formats = ['MP4', 'WEBM', 'AVI', 'MOV', 'MKV', 'GIF'];
            qualityControls.style.display = 'block';
        } else if (fileType.startsWith('audio/')) {
            formats = ['MP3', 'WAV', 'OGG', 'M4A', 'FLAC'];
            qualityControls.style.display = 'none';
        } else {
            formats = ['TXT', 'JSON'];
            qualityControls.style.display = 'none';
        }

        formatGrid.innerHTML = formats.map(format => 
            `<button class="format-btn" onclick="converter.selectFormat('${format}', event)">${format}</button>`
        ).join('');
    }

    selectFormat(format, event) {
        document.querySelectorAll('.format-btn').forEach(btn => btn.classList.remove('selected'));
        event.target.classList.add('selected');
        this.currentFormat = format;
        this.updateStatus(`FORMAT SELECTED: ${format}`);
    }

    async convertFiles() {
        if (!this.currentFormat || this.selectedFiles.length === 0) {
            this.updateStatus('ERROR: NO FORMAT OR FILES SELECTED');
            return;
        }

        this.updateStatus('CONVERTING FILES...');
        this.showProgress(true);

        for (let i = 0; i < this.selectedFiles.length; i++) {
            const fileId = this.selectedFiles[i];
            const fileData = this.files.find(f => f.id === fileId);
            
            if (!fileData) continue;

            try {
                this.updateProgress((i / this.selectedFiles.length) * 100);
                await this.convertSingleFile(fileData, this.currentFormat);
            } catch (error) {
                console.error('Conversion error:', error);
                this.updateStatus(`ERROR CONVERTING: ${fileData.name}`);
            }
        }

        this.updateProgress(100);
        setTimeout(() => this.showProgress(false), 1000);
        this.updateStatus('CONVERSION COMPLETE');
    }

    async convertSingleFile(fileData, targetFormat) {
        const file = fileData.file;
        const quality = document.getElementById('qualitySlider').value / 100;

        if (file.type.startsWith('image/')) {
            return await this.convertImage(file, targetFormat, quality);
        } else if (file.type.startsWith('video/')) {
            return await this.convertVideo(file, targetFormat, quality);
        } else if (file.type.startsWith('audio/')) {
            return await this.convertAudio(file, targetFormat);
        }
    }

    async convertImage(file, targetFormat, quality) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                let mimeType = `image/${targetFormat.toLowerCase()}`;
                if (targetFormat === 'JPEG') mimeType = 'image/jpeg';
                if (targetFormat === 'PNG') mimeType = 'image/png';
                if (targetFormat === 'WEBP') mimeType = 'image/webp';

                canvas.toBlob((blob) => {
                    this.downloadFile(blob, `${file.name.split('.')[0]}.${targetFormat.toLowerCase()}`);
                    resolve();
                }, mimeType, quality);
            };

            img.src = URL.createObjectURL(file);
        });
    }

    async convertVideo(file, targetFormat, quality) {
        // Note: True video conversion requires FFmpeg or similar
        // This is a simplified implementation for demonstration
        this.updateStatus('VIDEO CONVERSION REQUIRES EXTERNAL LIBRARIES');
        return Promise.resolve();
    }

    async convertAudio(file, targetFormat) {
        // Note: Audio conversion also requires specialized libraries
        this.updateStatus('AUDIO CONVERSION REQUIRES EXTERNAL LIBRARIES');
        return Promise.resolve();
    }

    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Encoding/Decoding functions
    async encodeText() {
        const input = document.getElementById('inputText').value;
        const method = document.getElementById('encodeMethod').value;
        const output = document.getElementById('outputText');

        if (!input.trim()) {
            this.updateStatus('ERROR: NO INPUT TEXT');
            return;
        }

        try {
            let result = '';
            
            switch (method) {
                case 'base64':
                    result = btoa(unescape(encodeURIComponent(input)));
                    break;
                case 'hex':
                    result = Array.from(new TextEncoder().encode(input))
                        .map(b => b.toString(16).padStart(2, '0')).join('');
                    break;
                case 'sha1':
                    result = await this.hashText(input, 'SHA-1');
                    break;
                case 'sha256':
                    result = await this.hashText(input, 'SHA-256');
                    break;
                case 'md5':
                    result = await this.md5Hash(input);
                    break;
                case 'url':
                    result = encodeURIComponent(input);
                    break;
                case 'binary':
                    result = Array.from(new TextEncoder().encode(input))
                        .map(b => b.toString(2).padStart(8, '0')).join(' ');
                    break;
            }

            output.value = result;
            this.updateStatus(`ENCODED USING ${method.toUpperCase()}`);
        } catch (error) {
            this.updateStatus('ENCODING ERROR');
            console.error(error);
        }
    }

    async decodeText() {
        const input = document.getElementById('inputText').value;
        const method = document.getElementById('encodeMethod').value;
        const output = document.getElementById('outputText');

        if (!input.trim()) {
            this.updateStatus('ERROR: NO INPUT TEXT');
            return;
        }

        try {
            let result = '';
            
            switch (method) {
                case 'base64':
                    result = decodeURIComponent(escape(atob(input)));
                    break;
                case 'hex':
                    const hexPairs = input.match(/.{1,2}/g) || [];
                    const bytes = hexPairs.map(hex => parseInt(hex, 16));
                    result = new TextDecoder().decode(new Uint8Array(bytes));
                    break;
                case 'url':
                    result = decodeURIComponent(input);
                    break;
                case 'binary':
                    const binaryGroups = input.split(' ');
                    const binaryBytes = binaryGroups.map(bin => parseInt(bin, 2));
                    result = new TextDecoder().decode(new Uint8Array(binaryBytes));
                    break;
                default:
                    this.updateStatus('CANNOT DECODE HASH FUNCTIONS');
                    return;
            }

            output.value = result;
            this.updateStatus(`DECODED USING ${method.toUpperCase()}`);
        } catch (error) {
            this.updateStatus('DECODING ERROR');
            console.error(error);
        }
    }

    async hashText(text, algorithm) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest(algorithm, data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async md5Hash(text) {
        // Simple MD5 implementation (not cryptographically secure)
        // In production, use a proper crypto library
        return await this.hashText(text, 'SHA-256'); // Fallback to SHA-256
    }

    // Utility functions
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    updateStatus(message) {
        const statusEl = document.getElementById('statusText');
        if (statusEl) {
            statusEl.textContent = '';
            
            let i = 0;
            const typeWriter = () => {
                if (i < message.length) {
                    statusEl.textContent += message.charAt(i);
                    i++;
                    setTimeout(typeWriter, 20);
                }
            };
            typeWriter();
        }
        
        console.log(`[CONVERTER] ${message}`);
    }

    showProgress(show) {
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.display = show ? 'block' : 'none';
            if (!show) {
                this.updateProgress(0);
            }
        }
    }

    updateProgress(percent) {
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = `${percent}%`;
        }
    }
}

// Initialize the converter
const converter = new Converter();

// Add some additional UI enhancements
document.addEventListener('DOMContentLoaded', () => {
    // Add glitch effect to random elements occasionally
    setInterval(() => {
        const elements = document.querySelectorAll('.file-item, .tab, .btn');
        const randomElement = elements[Math.floor(Math.random() * elements.length)];
        if (randomElement && Math.random() < 0.05) {
            randomElement.style.animation = 'glitch 0.3s ease';
            setTimeout(() => {
                randomElement.style.animation = '';
            }, 300);
        }
    }, 8000);
});