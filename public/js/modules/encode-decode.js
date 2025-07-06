import { Utils } from './utils.js';

export class EncodeDecode {
    constructor(utils) {
        this.utils = utils;
        this.initializeEncodeDecodeListeners();
    }

    // Sets up event listeners for encode/decode buttons and method selection.
    initializeEncodeDecodeListeners() {
        document.getElementById('encodeBtn').addEventListener('click', () => this.handleEncoding());
        document.getElementById('decodeBtn').addEventListener('click', () => this.handleDecoding());

        // Event listeners for method selection buttons (Base64, Hex, etc.)
        document.querySelectorAll('.method-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                // Deactivate all method buttons first
                document.querySelectorAll('.method-btn').forEach(btn => btn.classList.remove('active'));
                // Activate the clicked button
                e.target.classList.add('active');
            });
        });

        // Event listeners for copy buttons next to text areas
        document.querySelectorAll('.copy-textarea-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const targetTextAreaId = e.currentTarget.dataset.target;
                const textToCopy = document.getElementById(targetTextAreaId).value;
                this.utils.copyToClipboard(textToCopy);
            });
        });
    }

    // Handles the encoding process based on the selected method.
    async handleEncoding() {
        const inputText = document.getElementById('inputText').value;
        const selectedMethod = document.querySelector('.method-btn.active').dataset.value;
        const outputTextArea = document.getElementById('outputText');

        if (!inputText.trim()) {
            this.utils.updateStatus('ENCODE/DECODE: ERROR: NO INPUT TEXT');
            return;
        }

        try {
            let encodedResult = '';
            
            switch (selectedMethod) {
                case 'base64':
                    encodedResult = btoa(unescape(encodeURIComponent(inputText)));
                    break;
                case 'hex':
                    encodedResult = Array.from(new TextEncoder().encode(inputText))
                        .map(byte => byte.toString(16).padStart(2, '0')).join('');
                    break;
                case 'sha1':
                    encodedResult = await this.hashText(inputText, 'SHA-1');
                    break;
                case 'sha256':
                    encodedResult = await this.hashText(inputText, 'SHA-256');
                    break;
                case 'url':
                    encodedResult = encodeURIComponent(inputText);
                    break;
                case 'binary':
                    encodedResult = Array.from(new TextEncoder().encode(inputText))
                        .map(byte => byte.toString(2).padStart(8, '0')).join(' ');
                    break;
                default:
                    this.utils.updateStatus('ENCODE/DECODE: UNSUPPORTED ENCODING METHOD');
                    return;
            }

            outputTextArea.value = encodedResult;
            this.utils.updateStatus(`ENCODE/DECODE: ENCODED USING ${selectedMethod.toUpperCase()}`);
        } catch (error) {
            this.utils.updateStatus('ENCODE/DECODE: ENCODING ERROR');
            console.error('ERROR: ENCODE/DECODE: Operation failed.', error);
        }
    }

    // Handles the decoding process based on the selected method.
    async handleDecoding() {
        const inputText = document.getElementById('inputText').value;
        const selectedMethod = document.querySelector('.method-btn.active').dataset.value;
        const outputTextArea = document.getElementById('outputText');

        if (!inputText.trim()) {
            this.utils.updateStatus('ENCODE/DECODE: ERROR: NO INPUT TEXT');
            return;
        }

        try {
            let decodedResult = '';
            
            switch (selectedMethod) {
                case 'base64':
                    decodedResult = decodeURIComponent(escape(atob(inputText)));
                    break;
                case 'hex':
                    const hexBytePairs = inputText.match(/.{1,2}/g) || [];
                    const bytesFromHex = hexBytePairs.map(hex => parseInt(hex, 16));
                    decodedResult = new TextDecoder().decode(new Uint8Array(bytesFromHex));
                    break;
                case 'url':
                    decodedResult = decodeURIComponent(inputText);
                    break;
                case 'binary':
                    const binaryByteGroups = inputText.split(' ');
                    const bytesFromBinary = binaryByteGroups.map(bin => parseInt(bin, 2));
                    decodedResult = new TextDecoder().decode(new Uint8Array(bytesFromBinary));
                    break;
                default:
                    this.utils.updateStatus('ENCODE/DECODE: CANNOT DECODE HASH FUNCTIONS');
                    return;
            }

            outputTextArea.value = decodedResult;
            this.utils.updateStatus(`ENCODE/DECODE: DECODED USING ${selectedMethod.toUpperCase()}`);
        } catch (error) {
            this.utils.updateStatus('ENCODE/DECODE: DECODING ERROR');
            console.error('ERROR: ENCODE/DECODE: Operation failed.', error);
        }
    }

    // Hashes the given text using the specified algorithm.
    async hashText(text, algorithm) {
        const textEncoder = new TextEncoder();
        const dataBuffer = textEncoder.encode(text);
        const hashBuffer = await crypto.subtle.digest(algorithm, dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    }
}