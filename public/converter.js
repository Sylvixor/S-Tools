class Converter {
    constructor() {
        this.files = [];
        this.selectedFiles = [];
        this.currentFormat = '';
        this.typewriterTimeout = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupConverter(); // Initialize converter units on load
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const clickedTab = e.target.dataset.tab;
                
                this.switchTab(clickedTab);
                if (clickedTab === 'colors') {
                    const colorPicker = document.getElementById('colorPicker');
                    if (colorPicker) {
                        this.handleColorChange(colorPicker.value);
                    }
                } else if (clickedTab === 'converter') {
                    this.setupConverter();
                } else {
                    // Handled by switchTab now
                }
            });
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

        // Color Picker
        const colorPicker = document.getElementById('colorPicker');
        const customColorPicker = document.getElementById('customColorPicker');

        if (colorPicker && customColorPicker) {
            // When the custom div is clicked, open the native color picker
            customColorPicker.addEventListener('click', () => {
                console.log('Custom color picker clicked!');
                colorPicker.click();
            });

            // When the native color picker's value changes, update the custom div and values
            colorPicker.addEventListener('input', (e) => {
                this.handleColorChange(e.target.value);
            });
        }

        document.querySelectorAll('.copy-icon-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const targetId = e.currentTarget.dataset.target;
                const textToCopy = document.getElementById(targetId).value;
                this.copyToClipboard(textToCopy);
            });
        });

        document.querySelectorAll('.copy-textarea-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const targetId = e.currentTarget.dataset.target;
                const textToCopy = document.getElementById(targetId).value;
                this.copyToClipboard(textToCopy);
            });
        });

        // Encode/Decode method selection
        document.querySelectorAll('.method-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.method-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        

        // Add event listeners for unit selection changes
        document.getElementById('converterFromUnit').addEventListener('change', () => this.convertUnits());
        document.getElementById('converterToUnit').addEventListener('change', () => this.convertUnits());
        document.getElementById('converterInput').addEventListener('input', () => this.convertUnits());

        // Converter category selection
        document.getElementById('converterCategory').addEventListener('change', (e) => {
            this.populateUnitSelects(e.target.value);
            this.convertUnits(); // Re-convert after category change
        });
    }

    setupConverter() {
        const fromUnitSelect = document.getElementById('converterFromUnit');
        const toUnitSelect = document.getElementById('converterToUnit');

        // Clear previous options
        fromUnitSelect.innerHTML = '';
        toUnitSelect.innerHTML = '';

        // Define units and their conversion factors relative to a base unit
        this.units = {
            time: {
                base: 'seconds',
                conversions: {
                    milliseconds: 0.001,
                    seconds: 1,
                    minutes: 60,
                    hours: 3600,
                    days: 86400,
                    weeks: 604800,
                    months: 2629746, // Average month
                    years: 31556952 // Average year
                }
            },
            length: {
                base: 'meters',
                conversions: {
                    nanometers: 1e-9,
                    micrometers: 1e-6,
                    millimeters: 0.001,
                    centimeters: 0.01,
                    meters: 1,
                    kilometers: 1000,
                    inches: 0.0254,
                    feet: 0.3048,
                    yards: 0.9144,
                    miles: 1609.34
                }
            },
            weight: {
                base: 'grams',
                conversions: {
                    milligrams: 0.001,
                    grams: 1,
                    kilograms: 1000,
                    ounces: 28.3495,
                    pounds: 453.592,
                    tonnes: 1e6
                }
            },
            temperature: {
                base: 'celsius',
                conversions: {
                    celsius: { toBase: (val) => val, fromBase: (val) => val },
                    fahrenheit: { toBase: (val) => (val - 32) * 5/9, fromBase: (val) => (val * 9/5) + 32 },
                    kelvin: { toBase: (val) => val - 273.15, fromBase: (val) => val + 273.15 }
                }
            },
            
        };

        // Default to time conversion
        this.populateUnitSelects('time');
    }

    populateUnitSelects(category) {
        const fromUnitSelect = document.getElementById('converterFromUnit');
        const toUnitSelect = document.getElementById('converterToUnit');
        const units = this.units[category].conversions;

        fromUnitSelect.innerHTML = '';
        toUnitSelect.innerHTML = '';

        for (const unit in units) {
            const optionFrom = document.createElement('option');
            optionFrom.value = unit;
            optionFrom.textContent = unit.charAt(0).toUpperCase() + unit.slice(1);
            fromUnitSelect.appendChild(optionFrom);

            const optionTo = document.createElement('option');
            optionTo.value = unit;
            optionTo.textContent = unit.charAt(0).toUpperCase() + unit.slice(1);
            toUnitSelect.appendChild(optionTo);
        }

        // Set default selections
        fromUnitSelect.value = Object.keys(units)[0];
        toUnitSelect.value = Object.keys(units)[1];
    }

    convertUnits() {
        const inputValue = parseFloat(document.getElementById('converterInput').value);
        const fromUnit = document.getElementById('converterFromUnit').value;
        const toUnit = document.getElementById('converterToUnit').value;
        const outputField = document.getElementById('converterOutput');

        if (isNaN(inputValue) || document.getElementById('converterInput').value.trim() === '') {
            outputField.value = ''; // Clear the output if input is empty or invalid
            // Do not update status for empty input
            if (document.getElementById('converterInput').value.trim() !== '') {
                this.updateStatus('CONVERTER: ERROR: INVALID INPUT');
            }
            return;
        }

        let result;
        let category;

        // Determine category based on fromUnit
        for (const cat in this.units) {
            if (this.units[cat].conversions[fromUnit]) {
                category = cat;
                break;
            }
        }

        if (!category) {
            outputField.value = 'Error';
            this.updateStatus('CONVERTER: ERROR: UNKNOWN UNIT');
            return;
        }

        const unitData = this.units[category].conversions;
        const baseUnit = this.units[category].base;

        if (category === 'temperature') {
            // Temperature conversion is special (not linear)
            const toBaseFunc = unitData[fromUnit].toBase;
            const fromBaseFunc = unitData[toUnit].fromBase;

            const valueInBase = toBaseFunc(inputValue);
            result = fromBaseFunc(valueInBase);
        } else {
            // Convert input to base unit
            const valueInBase = inputValue * unitData[fromUnit];
            // Convert from base unit to target unit
            result = valueInBase / unitData[toUnit];
        }

        outputField.value = result.toFixed(4); // Display with 4 decimal places
        this.updateStatus(`CONVERTER: CONVERTED ${inputValue} ${fromUnit.toUpperCase()} TO ${result.toFixed(4)} ${toUnit.toUpperCase()}`);
    }

    switchTab(tabName) {
        const currentActiveTabContent = document.querySelector('.tab-content.active');
        const newTabContent = document.getElementById(tabName);
        const currentActiveTabButton = document.querySelector('.tab.active');
        const paletteContainer = document.getElementById('paletteContainer');

        // If the clicked tab is already active, do nothing
        if (currentActiveTabButton && currentActiveTabButton.dataset.tab === tabName) {
            return;
        }

        // Update tab buttons
        if (currentActiveTabButton) {
            currentActiveTabButton.classList.remove('active');
        }
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        if (currentActiveTabContent) {
            // If switching FROM the colors tab, apply fade-out to paletteContainer
            if (currentActiveTabContent.id === 'colors' && paletteContainer) {
                paletteContainer.classList.add('fade-out-down');
                paletteContainer.classList.remove('fade-in-up');
            }

            currentActiveTabContent.classList.add('fade-out-down');
            currentActiveTabContent.classList.remove('fade-in-up'); // Ensure old animation is removed
            
            // Use setTimeout to control the animation and class removal
            setTimeout(() => {
                currentActiveTabContent.classList.remove('active', 'fade-out-down');
                // If we switched FROM the colors tab, hide and clear the palette after its fade-out
                if (currentActiveTabContent.id === 'colors' && paletteContainer) {
                    paletteContainer.classList.remove('fade-out-down');
                    paletteContainer.style.display = 'none';
                    paletteContainer.innerHTML = ''; // Clear content after fade out
                }

                newTabContent.classList.add('active', 'fade-in-up');
                this.handleTabContentVisibility(tabName);
            }, 300); // Match this duration to the CSS animation duration
        } else {
            newTabContent.classList.add('active', 'fade-in-up');
            this.handleTabContentVisibility(tabName);
        }

        this.updateStatus(`TAB: SWITCHED TO ${tabName.toUpperCase()}`);
    }

    handleTabContentVisibility(tabName) {
        const paletteContainer = document.getElementById('paletteContainer');
        if (tabName === 'colors') {
            paletteContainer.style.display = 'block';
            paletteContainer.classList.add('fade-in-up'); // Add fade-in for palette
            paletteContainer.classList.remove('fade-out-down'); // Ensure old animation is removed
            const colorPicker = document.getElementById('colorPicker');
            if (colorPicker) {
                this.handleColorChange(colorPicker.value);
            }
        } else if (tabName === 'converter') {
            this.setupConverter();
        } else {
            // No direct manipulation of paletteContainer.style.display here for non-color tabs
            // It's handled in switchTab now.
        }
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
        this.updateStatus('FILE: PROCESSING FILES...');
        
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
        this.updateStatus(`FILE: LOADED ${files.length} FILES`);
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
        const clickedFileData = this.files.find(f => f.id == fileId);
        if (!clickedFileData) return;

        const clickedFileType = this.getFileBaseType(clickedFileData.type);

        if (isSelected) {
            fileItem.classList.remove('selected');
            this.selectedFiles = this.selectedFiles.filter(id => id !== fileId);
        } else {
            // If the selected file's type is different from the currently selected files, clear the selection.
            if (this.selectedFiles.length > 0) {
                const firstSelectedFileData = this.files.find(f => f.id == this.selectedFiles[0]);
                const firstSelectedFileType = this.getFileBaseType(firstSelectedFileData.type);

                if (clickedFileType !== firstSelectedFileType) {
                    this.selectedFiles.forEach(id => {
                        document.querySelector(`[data-id="${id}"]`).classList.remove('selected');
                    });
                    this.selectedFiles = [];
                }
            }

            fileItem.classList.add('selected');
            this.selectedFiles.push(fileId);
        }

        this.updateConversionPanel();
        const fileCount = this.selectedFiles.length;
        this.updateStatus(`FILE: SELECTED ${fileCount} FILE${fileCount !== 1 ? 'S' : ''}`);
    }

    removeFile(fileId) {
        this.files = this.files.filter(file => file.id != fileId);
        this.selectedFiles = this.selectedFiles.filter(id => id !== fileId);
        this.renderFileList();
        this.updateConversionPanel();
        
        // Clear the file input so the same file can be uploaded again
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.value = '';
        }
        
        this.updateStatus('FILE: REMOVED');
    }

    updateConversionPanel() {
        const panel = document.getElementById('conversionPanel');
        
        // Hide panel if no files exist or no files are selected
        if (this.files.length === 0 || this.selectedFiles.length === 0) {
            panel.style.display = 'none';
            return;
        }

        panel.style.display = 'block';
        this.updateFormatOptions();
    }

    updateFormatOptions() {
        const selectedFile = this.files.find(f => f.id == this.selectedFiles[0]);
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
        this.updateStatus(`FORMAT: SELECTED ${format}`);
    }

    async convertFiles() {
        if (!this.currentFormat || this.selectedFiles.length === 0) {
            this.updateStatus('ERROR: NO FORMAT OR FILES SELECTED');
            return;
        }

        this.updateStatus('CONVERSION: IN PROGRESS...');
        this.showProgress(true);

        for (let i = 0; i < this.selectedFiles.length; i++) {
            const fileId = this.selectedFiles[i];
            const fileData = this.files.find(f => f.id === fileId);
            
            if (!fileData) continue;

            try {
                this.updateProgress((i / this.selectedFiles.length) * 100);
                await this.convertSingleFile(fileData, this.currentFormat);
            } catch (error) {
                console.error('ERROR: CONVERSION: ', error);
                this.updateStatus(`ERROR: CONVERTING ${fileData.name}`);
            }
        }

        this.updateProgress(100);
        setTimeout(() => this.showProgress(false), 1000);
        this.updateStatus('CONVERSION: COMPLETE');
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
                    this.downloadFile(blob, `${file.name.substring(0, file.name.lastIndexOf('.')) || file.name}.${targetFormat.toLowerCase()}`);
                    resolve();
                }, mimeType, quality);
            };

            img.src = URL.createObjectURL(file);
        });
    }

    async convertVideo(file, targetFormat, quality) {
        // Note: True video conversion requires FFmpeg or similar
        // This is a simplified implementation for demonstration
        this.updateStatus('CONVERSION: VIDEO REQUIRES EXTERNAL LIBRARIES');
        return Promise.resolve();
    }

    async convertAudio(file, targetFormat) {
        // Note: Audio conversion also requires specialized libraries
        this.updateStatus('CONVERSION: AUDIO REQUIRES EXTERNAL LIBRARIES');
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
        const method = document.querySelector('.method-btn.active').dataset.value;
        const output = document.getElementById('outputText');

        if (!input.trim()) {
            this.updateStatus('ENCODE/DECODE: ERROR: NO INPUT TEXT');
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
                case 'url':
                    result = encodeURIComponent(input);
                    break;
                case 'binary':
                    result = Array.from(new TextEncoder().encode(input))
                        .map(b => b.toString(2).padStart(8, '0')).join(' ');
                    break;
            }

            output.value = result;
            this.updateStatus(`ENCODE/DECODE: ENCODED USING ${method.toUpperCase()}`);
        } catch (error) {
            this.updateStatus('ENCODE/DECODE: ENCODING ERROR');
            console.error('ERROR: ENCODE/DECODE: Operation failed.', error);
        }
    }

    async decodeText() {
        const input = document.getElementById('inputText').value;
        const method = document.querySelector('.method-btn.active').dataset.value;
        const output = document.getElementById('outputText');

        if (!input.trim()) {
            this.updateStatus('ENCODE/DECODE: ERROR: NO INPUT TEXT');
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
                    this.updateStatus('ENCODE/DECODE: CANNOT DECODE HASH FUNCTIONS');
                    return;
            }

            output.value = result;
            this.updateStatus(`ENCODE/DECODE: DECODED USING ${method.toUpperCase()}`);
        } catch (error) {
            this.updateStatus('ENCODE/DECODE: DECODING ERROR');
            console.error('ERROR: ENCODE/DECODE: Operation failed.', error);
        }
    }

    async hashText(text, algorithm) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest(algorithm, data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    handleColorChange(hex) {
        const rgb = this.hexToRgb(hex);
        const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);

        document.getElementById('hexValue').value = hex.toUpperCase();
        document.getElementById('rgbValue').value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        document.getElementById('hslValue').value = `hsl(${hsl.h.toFixed(0)}, ${hsl.s.toFixed(0)}%, ${hsl.l.toFixed(0)}%)`;

        // Update the custom color picker's background
        document.getElementById('customColorPicker').style.backgroundColor = hex;

        // Only generate palette if the colors tab is active
        if (document.querySelector('.tab[data-tab="colors"]').classList.contains('active')) {
            this.generatePalette(hsl);
        }
    }

    hexToRgb(hex) {
        const r = parseInt(hex.substring(1, 3), 16);
        const g = parseInt(hex.substring(3, 5), 16);
        const b = parseInt(hex.substring(5, 7), 16);
        return { r, g, b };
    }

    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return { h: h * 360, s: s * 100, l: l * 100 };
    }

    hslToRgb(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;

        let r, g, b;

        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
    }

    rgbToHex(r, g, b) {
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    generatePalette(baseHsl) {
        const paletteContainer = document.getElementById('paletteContainer');
        paletteContainer.innerHTML = '';

        const palettes = {
            'Monochromatic': this.generateMonochromaticPalette(baseHsl),
            'Analogous': this.generateAnalogousPalette(baseHsl),
            'Complementary': this.generateComplementaryPalette(baseHsl),
            'Triadic': this.generateTriadicPalette(baseHsl),
            'Tetradic': this.generateTetradicPalette(baseHsl)
        };

        for (const paletteName in palettes) {
            const paletteColors = palettes[paletteName];
            const paletteSection = document.createElement('div');
            paletteSection.className = 'palette-section';
            paletteSection.innerHTML = `<div class="panel-title">${paletteName}</div>`;

            const colorContainer = document.createElement('div');
            colorContainer.className = 'palette-grid';

            paletteColors.forEach(hsl => {
                const rgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);
                const hex = this.rgbToHex(rgb.r, rgb.g, rgb.b);
                const paletteColorDiv = document.createElement('div');
                paletteColorDiv.className = 'palette-color';
                paletteColorDiv.style.backgroundColor = hex;
                paletteColorDiv.textContent = hex.toUpperCase();
                paletteColorDiv.title = `HEX: ${hex.toUpperCase()}\nRGB: rgb(${rgb.r}, ${rgb.g}, ${rgb.b})\nHSL: hsl(${hsl.h.toFixed(0)}, ${hsl.s.toFixed(0)}%, ${hsl.l.toFixed(0)}%)`;
                paletteColorDiv.addEventListener('click', () => {
                    navigator.clipboard.writeText(hex.toUpperCase());
                    this.updateStatus(`COPIED ${hex.toUpperCase()} TO CLIPBOARD`);
                });
                colorContainer.appendChild(paletteColorDiv);
            });
            paletteSection.appendChild(colorContainer);
            paletteContainer.appendChild(paletteSection);
        }
    }

    generateMonochromaticPalette(baseHsl) {
        const colors = [];
        // Generate 5 monochromatic colors with variations in lightness and saturation
        for (let i = 0; i < 5; i++) {
            const l = Math.max(0, Math.min(100, baseHsl.l + (i - 2) * 15)); // Vary lightness
            const s = Math.max(0, Math.min(100, baseHsl.s + (i - 2) * 5));  // Vary saturation slightly
            colors.push({ h: baseHsl.h, s: s, l: l });
        }
        return colors;
    }

    generateAnalogousPalette(baseHsl) {
        const colors = [];
        colors.push(baseHsl); // Base color
        // Analogous colors with slight variations in lightness and saturation
        colors.push({ h: (baseHsl.h + 30) % 360, s: Math.max(0, baseHsl.s - 10), l: Math.max(0, baseHsl.l - 10) });
        colors.push({ h: (baseHsl.h - 30 + 360) % 360, s: Math.min(100, baseHsl.s + 10), l: Math.min(100, baseHsl.l + 10) });
        colors.push({ h: (baseHsl.h + 60) % 360, s: Math.max(0, baseHsl.s - 5), l: Math.min(100, baseHsl.l + 5) });
        colors.push({ h: (baseHsl.h - 60 + 360) % 360, s: Math.min(100, baseHsl.s + 5), l: Math.max(0, baseHsl.l - 5) });
        return colors;
    }

    generateComplementaryPalette(baseHsl) {
        const colors = [];
        colors.push(baseHsl); // Base color
        const complementaryHue = (baseHsl.h + 180) % 360;

        // Complementary color with slight variations
        colors.push({ h: complementaryHue, s: baseHsl.s, l: baseHsl.l });
        colors.push({ h: baseHsl.h, s: Math.max(0, baseHsl.s - 15), l: Math.min(100, baseHsl.l + 15) });
        colors.push({ h: complementaryHue, s: Math.min(100, baseHsl.s + 15), l: Math.max(0, baseHsl.l - 15) });
        colors.push({ h: baseHsl.h, s: baseHsl.s, l: Math.max(0, baseHsl.l - 10) });
        return colors;
    }

    generateTriadicPalette(baseHsl) {
        const colors = [];
        colors.push(baseHsl); // Base color
        // Triadic colors with variations
        colors.push({ h: (baseHsl.h + 120) % 360, s: Math.max(0, baseHsl.s - 10), l: Math.min(100, baseHsl.l + 10) });
        colors.push({ h: (baseHsl.h + 240) % 360, s: Math.min(100, baseHsl.s + 10), l: Math.max(0, baseHsl.l - 10) });
        colors.push({ h: (baseHsl.h + 60) % 360, s: baseHsl.s, l: baseHsl.l }); // Additional color for richness
        colors.push({ h: (baseHsl.h - 60 + 360) % 360, s: baseHsl.s, l: baseHsl.l }); // Additional color for richness
        return colors;
    }

    generateTetradicPalette(baseHsl) {
        const colors = [];
        colors.push(baseHsl); // Base color
        // Tetradic colors with variations
        colors.push({ h: (baseHsl.h + 90) % 360, s: Math.max(0, baseHsl.s - 10), l: Math.min(100, baseHsl.l + 10) });
        colors.push({ h: (baseHsl.h + 180) % 360, s: baseHsl.s, l: baseHsl.l });
        colors.push({ h: (baseHsl.h + 270) % 360, s: Math.min(100, baseHsl.s + 10), l: Math.max(0, baseHsl.l - 10) });
        colors.push({ h: baseHsl.h, s: Math.max(0, baseHsl.s - 5), l: Math.min(100, baseHsl.l + 5) }); // Additional variation
        return colors;
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.updateStatus(`CLIPBOARD: COPIED "${text}"`);
        } catch (err) {
            console.error('ERROR: CLIPBOARD: Failed to copy.', err);
            this.updateStatus('CLIPBOARD: FAILED TO COPY');
        }
    }

    // Utility functions
    getFileBaseType(fileType) {
        if (fileType.startsWith('image/')) return 'image';
        if (fileType.startsWith('video/')) return 'video';
        if (fileType.startsWith('audio/')) return 'audio';
        return 'other';
    }

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
            clearTimeout(this.typewriterTimeout);
            statusEl.textContent = '';
            
            let i = 0;
            const typeWriter = () => {
                if (i < message.length) {
                    statusEl.textContent += message.charAt(i);
                    i++;
                    this.typewriterTimeout = setTimeout(typeWriter, 20);
                } else {
                    this.typewriterTimeout = null;
                }
            };
            typeWriter();
        }
        
        console.log(`INFO: ${message}`);
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