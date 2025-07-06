import { Utils } from './utils.js';

export class FileOperations {
    constructor(utils) {
        this.uploadedFiles = [];
        this.currentlySelectedFiles = [];
        this.targetFormat = '';
        this.utils = utils;
        this.initEventListeners();
    }

    // Sets up all necessary event listeners for file operations.
    initEventListeners() {
        const uploadArea = document.getElementById('uploadZone');
        const hiddenFileInput = document.getElementById('fileInput');
        
        uploadArea.addEventListener('click', () => hiddenFileInput.click());
        uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        uploadArea.addEventListener('drop', (e) => this.handleFileDrop(e));
        hiddenFileInput.addEventListener('change', (e) => this.handleFileSelection(e));

        document.getElementById('convertBtn').addEventListener('click', () => this.initiateConversion());

        const qualityInput = document.getElementById('qualitySlider');
        qualityInput.addEventListener('input', (e) => {
            document.getElementById('qualityValue').textContent = e.target.value;
        });
    }

    // Handles the dragover event for the upload zone.
    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    // Handles the dragleave event for the upload zone.
    handleDragLeave(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
    }

    // Handles files dropped into the upload zone.
    handleFileDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        const droppedFiles = Array.from(e.dataTransfer.files);
        this.processIncomingFiles(droppedFiles);
    }

    // Handles files selected via the file input dialog.
    handleFileSelection(e) {
        const selectedFiles = Array.from(e.target.files);
        this.processIncomingFiles(selectedFiles);
    }

    // Adds new files to the internal list and updates the UI.
    processIncomingFiles(files) {
        this.utils.updateStatus('FILE: PROCESSING FILES...');
        
        files.forEach(file => {
            const fileRecord = {
                id: Date.now() + Math.random(), // Unique ID for tracking
                file: file,
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified
            };
            this.uploadedFiles.push(fileRecord);
        });

        this.renderUploadedFileList();
        this.utils.updateStatus(`FILE: LOADED ${files.length} FILES`);
    }

    // Renders the list of uploaded files in the UI.
    renderUploadedFileList() {
        const fileListContainer = document.getElementById('fileList');
        fileListContainer.innerHTML = '';

        this.uploadedFiles.forEach(fileData => {
            const fileItemElement = document.createElement('div');
            fileItemElement.className = 'file-item';
            fileItemElement.dataset.id = fileData.id;
            
            fileItemElement.innerHTML = `
                <div class="file-info">
                    <div class="file-name">${fileData.name}</div>
                    <div class="file-meta">
                        <span>SIZE: ${this.utils.formatFileSize(fileData.size)}</span>
                        <span>TYPE: ${fileData.type || 'unknown'}</span>
                        <span>MODIFIED: ${new Date(fileData.lastModified).toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="btn danger" onclick="window.fileOperations.removeFileById('${fileData.id}')">REMOVE</button>
                </div>
            `;

            fileItemElement.addEventListener('click', (e) => {
                // Prevent toggling selection when remove button is clicked
                if (!e.target.classList.contains('btn')) {
                    this.toggleFileSelection(fileData.id);
                }
            });

            fileListContainer.appendChild(fileItemElement);
        });
    }

    // Toggles the selection state of a file.
    toggleFileSelection(fileId) {
        const fileItemElement = document.querySelector(`[data-id="${fileId}"]`);
        const isCurrentlySelected = fileItemElement.classList.contains('selected');
        const clickedFile = this.uploadedFiles.find(f => f.id == fileId);
        if (!clickedFile) return;

        const clickedFileBaseType = this.getFileBaseType(clickedFile.type);

        if (isCurrentlySelected) {
            fileItemElement.classList.remove('selected');
            this.currentlySelectedFiles = this.currentlySelectedFiles.filter(id => id !== fileId);
        } else {
            // If a different file type is already selected, clear previous selections
            if (this.currentlySelectedFiles.length > 0) {
                const firstSelectedFile = this.uploadedFiles.find(f => f.id == this.currentlySelectedFiles[0]);
                const firstSelectedFileBaseType = this.getFileBaseType(firstSelectedFile.type);

                if (clickedFileBaseType !== firstSelectedFileBaseType) {
                    this.currentlySelectedFiles.forEach(id => {
                        document.querySelector(`[data-id="${id}"]`).classList.remove('selected');
                    });
                    this.currentlySelectedFiles = [];
                }
            }

            fileItemElement.classList.add('selected');
            this.currentlySelectedFiles.push(fileId);
        }

        this.updateConversionPanelVisibility();
        const selectedCount = this.currentlySelectedFiles.length;
        this.utils.updateStatus(`FILE: SELECTED ${selectedCount} FILE${selectedCount !== 1 ? 'S' : ''}`);
    }

    // Removes a file from the uploaded list and updates the UI.
    removeFileById(fileId) {
        this.uploadedFiles = this.uploadedFiles.filter(file => file.id != fileId);
        this.currentlySelectedFiles = this.currentlySelectedFiles.filter(id => id !== fileId);
        this.renderUploadedFileList();
        this.updateConversionPanelVisibility();
        
        // Clear the file input so the same file can be uploaded again immediately
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.value = '';
        }
        
        this.utils.updateStatus('FILE: REMOVED');
    }

    // Controls the visibility and content of the conversion options panel.
    updateConversionPanelVisibility() {
        const conversionPanel = document.getElementById('conversionPanel');
        
        if (this.uploadedFiles.length === 0 || this.currentlySelectedFiles.length === 0) {
            conversionPanel.style.display = 'none';
            return;
        }

        conversionPanel.style.display = 'block';
        this.populateFormatOptions();
    }

    // Populates the conversion format options based on the type of the selected file.
    populateFormatOptions() {
        const selectedFile = this.uploadedFiles.find(f => f.id == this.currentlySelectedFiles[0]);
        if (!selectedFile) return;

        const formatGridContainer = document.getElementById('formatGrid');
        const qualityControlsSection = document.getElementById('qualityControls');
        
        let availableFormats = [];
        const fileBaseType = this.getFileBaseType(selectedFile.type);

        switch (fileBaseType) {
            case 'image':
                availableFormats = ['PNG', 'JPEG', 'WEBP', 'GIF', 'BMP', 'ICO'];
                qualityControlsSection.style.display = 'block';
                break;
            case 'video':
                availableFormats = ['MP4', 'WEBM', 'AVI', 'MOV', 'MKV', 'GIF'];
                qualityControlsSection.style.display = 'block';
                break;
            case 'audio':
                availableFormats = ['MP3', 'WAV', 'OGG', 'M4A', 'FLAC'];
                qualityControlsSection.style.display = 'none';
                break;
            default:
                availableFormats = ['TXT', 'JSON'];
                qualityControlsSection.style.display = 'none';
                break;
        }

        formatGridContainer.innerHTML = availableFormats.map(format => 
            `<button class="format-btn" onclick="window.fileOperations.selectConversionFormat('${format}', event)">${format}</button>`
        ).join('');
    }

    // Sets the chosen conversion format and updates the UI.
    selectConversionFormat(format, event) {
        document.querySelectorAll('.format-btn').forEach(btn => btn.classList.remove('selected'));
        event.target.classList.add('selected');
        this.targetFormat = format;
        this.utils.updateStatus(`FORMAT: SELECTED ${format}`);
    }

    // Initiates the file conversion process for all selected files.
    async initiateConversion() {
        if (!this.targetFormat || this.currentlySelectedFiles.length === 0) {
            this.utils.updateStatus('ERROR: NO FORMAT OR FILES SELECTED');
            return;
        }

        this.utils.updateStatus('CONVERSION: IN PROGRESS...');
        this.utils.showProgress(true);

        for (let i = 0; i < this.currentlySelectedFiles.length; i++) {
            const fileId = this.currentlySelectedFiles[i];
            const fileToConvert = this.uploadedFiles.find(f => f.id === fileId);
            
            if (!fileToConvert) continue;

            try {
                this.utils.updateProgressBar((i / this.currentlySelectedFiles.length) * 100);
                await this.convertSingleFile(fileToConvert, this.targetFormat);
            } catch (error) {
                console.error('ERROR: CONVERSION: ', error);
                this.utils.updateStatus(`ERROR: CONVERTING ${fileToConvert.name}`);
            }
        }

        this.utils.updateProgressBar(100);
        setTimeout(() => this.utils.showProgress(false), 1000);
        this.utils.updateStatus('CONVERSION: COMPLETE');
    }

    // Converts a single file based on its type.
    async convertSingleFile(fileData, format) {
        const file = fileData.file;
        const conversionQuality = document.getElementById('qualitySlider').value / 100;

        if (file.type.startsWith('image/')) {
            return await this.convertImage(file, format, conversionQuality);
        } else if (file.type.startsWith('video/')) {
            this.utils.updateStatus('CONVERSION: VIDEO REQUIRES EXTERNAL LIBRARIES');
            return Promise.resolve();
        } else if (file.type.startsWith('audio/')) {
            this.utils.updateStatus('CONVERSION: AUDIO REQUIRES EXTERNAL LIBRARIES');
            return Promise.resolve();
        }
    }

    // Converts an image file using a canvas.
    async convertImage(imageFile, targetFormat, quality) {
        return new Promise((resolve) => {
            const canvasElement = document.createElement('canvas');
            const canvasContext = canvasElement.getContext('2d');
            const imgElement = new Image();

            imgElement.onload = () => {
                canvasElement.width = imgElement.width;
                canvasElement.height = imgElement.height;
                canvasContext.drawImage(imgElement, 0, 0);

                let mimeType = `image/${targetFormat.toLowerCase()}`;
                // Specific MIME types for common image formats
                if (targetFormat === 'JPEG') mimeType = 'image/jpeg';
                if (targetFormat === 'PNG') mimeType = 'image/png';
                if (targetFormat === 'WEBP') mimeType = 'image/webp';

                canvasElement.toBlob((blob) => {
                    const outputFilename = `${imageFile.name.substring(0, imageFile.name.lastIndexOf('.')) || imageFile.name}.${targetFormat.toLowerCase()}`;
                    this.downloadGeneratedFile(blob, outputFilename);
                    resolve();
                }, mimeType, quality);
            };

            imgElement.src = URL.createObjectURL(imageFile);
        });
    }

    // Triggers the download of a generated file (Blob).
    downloadGeneratedFile(fileBlob, filename) {
        const downloadUrl = URL.createObjectURL(fileBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = downloadUrl;
        downloadLink.download = filename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(downloadUrl); // Clean up the object URL
    }

    // Determines the base type of a file (e.g., 'image', 'video', 'audio').
    getFileBaseType(fileMimeType) {
        if (fileMimeType.startsWith('image/')) return 'image';
        if (fileMimeType.startsWith('video/')) return 'video';
        if (fileMimeType.startsWith('audio/')) return 'audio';
        return 'other';
    }
}