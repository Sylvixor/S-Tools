import { Utils } from './utils.js';

export class ColorUtilities {
    constructor(utils) {
        this.utils = utils; // Utility class instance
        this.setupColorEventListeners();
    }

    // Sets up event listeners for the color picker and copy buttons.
    setupColorEventListeners() {
        const nativeColorPicker = document.getElementById('colorPicker');
        const customColorDisplay = document.getElementById('customColorPicker');

        if (nativeColorPicker && customColorDisplay) {
            // When the custom div is clicked, trigger the native color picker
            customColorDisplay.addEventListener('click', () => {
                console.log('Custom color picker clicked!');
                nativeColorPicker.click();
            });

            // When the native color picker's value changes, update UI
            nativeColorPicker.addEventListener('input', (e) => {
                this.updateColorDisplay(e.target.value);
            });
        }

        // Event listeners for copy buttons next to color value inputs
        document.querySelectorAll('.copy-icon-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const targetInputId = e.currentTarget.dataset.target;
                const textToCopy = document.getElementById(targetInputId).value;
                this.utils.copyToClipboard(textToCopy);
            });
        });
    }

    //Updates the displayed HEX, RGB, and HSL values and generates color palettes.
    updateColorDisplay(hexColor) {
        const rgb = this.hexToRgb(hexColor);
        const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);

        document.getElementById('hexValue').value = hexColor.toUpperCase();
        document.getElementById('rgbValue').value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        document.getElementById('hslValue').value = `hsl(${hsl.h.toFixed(0)}, ${hsl.s.toFixed(0)}%, ${hsl.l.toFixed(0)}%)`;

        // Update the background of the custom color picker display
        document.getElementById('customColorPicker').style.backgroundColor = hexColor;

        // Only generate palette if the colors tab is currently active
        if (document.querySelector('.tab[data-tab="colors"]').classList.contains('active')) {
            this.generateColorPalettes(hsl);
        }
    }

    //Converts a HEX color string to an RGB object.
    hexToRgb(hex) {
        const r = parseInt(hex.substring(1, 3), 16);
        const g = parseInt(hex.substring(3, 5), 16);
        const b = parseInt(hex.substring(5, 7), 16);
        return { r, g, b };
    }

    // Converts RGB color values to HSL color values.
    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
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

    // Converts HSL color values to RGB color values.
    hslToRgb(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;

        let r, g, b;

        if (s === 0) {
            r = g = b = l;
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

    // Converts RGB color values to a HEX color string.
    rgbToHex(r, g, b) {
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    // Generates and displays various color palettes based on a base HSL color.
    generateColorPalettes(baseHsl) {
        const paletteContainer = document.getElementById('paletteContainer');
        paletteContainer.innerHTML = ''; // Clear existing palettes

        const palettes = {
            'Monochromatic': this.generateMonochromaticPalette(baseHsl),
            'Analogous': this.generateAnalogousPalette(baseHsl),
            'Complementary': this.generateComplementaryPalette(baseHsl),
            'Triadic': this.generateTriadicPalette(baseHsl),
            'Tetradic': this.generateTetradicPalette(baseHsl)
        };

        for (const paletteName in palettes) {
            const colorsInPalette = palettes[paletteName];
            const paletteSection = document.createElement('div');
            paletteSection.className = 'palette-section';
            paletteSection.innerHTML = `<div class="panel-title">${paletteName}</div>`;

            const colorGrid = document.createElement('div');
            colorGrid.className = 'palette-grid';

            colorsInPalette.forEach(hsl => {
                const rgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);
                const hex = this.rgbToHex(rgb.r, rgb.g, rgb.b);
                const colorDisplayDiv = document.createElement('div');
                colorDisplayDiv.className = 'palette-color';
                colorDisplayDiv.style.backgroundColor = hex;
                colorDisplayDiv.textContent = hex.toUpperCase();
                colorDisplayDiv.title = `HEX: ${hex.toUpperCase()}\nRGB: rgb(${rgb.r}, ${rgb.g}, ${rgb.b})\nHSL: hsl(${hsl.h.toFixed(0)}, ${hsl.s.toFixed(0)}%, ${hsl.l.toFixed(0)}%)`;
                colorDisplayDiv.addEventListener('click', () => {
                    navigator.clipboard.writeText(hex.toUpperCase());
                    this.utils.updateStatus(`COPIED ${hex.toUpperCase()} TO CLIPBOARD`);
                });
                colorGrid.appendChild(colorDisplayDiv);
            });
            paletteSection.appendChild(colorGrid);
            paletteContainer.appendChild(paletteSection);
        }
    }

    // Generates a monochromatic color palette.
    generateMonochromaticPalette(baseHsl) {
        const colors = [];
        for (let i = 0; i < 5; i++) {
            const lightness = Math.max(0, Math.min(100, baseHsl.l + (i - 2) * 15));
            const saturation = Math.max(0, Math.min(100, baseHsl.s + (i - 2) * 5));
            colors.push({ h: baseHsl.h, s: saturation, l: lightness });
        }
        return colors;
    }

    // Generates an analogous color palette.
    generateAnalogousPalette(baseHsl) {
        const colors = [];
        colors.push(baseHsl); // Base color
        colors.push({ h: (baseHsl.h + 30) % 360, s: Math.max(0, baseHsl.s - 10), l: Math.max(0, baseHsl.l - 10) });
        colors.push({ h: (baseHsl.h - 30 + 360) % 360, s: Math.min(100, baseHsl.s + 10), l: Math.min(100, baseHsl.l + 10) });
        colors.push({ h: (baseHsl.h + 60) % 360, s: Math.max(0, baseHsl.s - 5), l: Math.min(100, baseHsl.l + 5) });
        colors.push({ h: (baseHsl.h - 60 + 360) % 360, s: Math.min(100, baseHsl.s + 5), l: Math.max(0, baseHsl.l - 5) });
        return colors;
    }

    // Generates a complementary color palette.
    generateComplementaryPalette(baseHsl) {
        const colors = [];
        colors.push(baseHsl); // Base color
        const complementaryHue = (baseHsl.h + 180) % 360;

        colors.push({ h: complementaryHue, s: baseHsl.s, l: baseHsl.l });
        colors.push({ h: baseHsl.h, s: Math.max(0, baseHsl.s - 15), l: Math.min(100, baseHsl.l + 15) });
        colors.push({ h: complementaryHue, s: Math.min(100, baseHsl.s + 15), l: Math.max(0, baseHsl.l - 15) });
        colors.push({ h: baseHsl.h, s: baseHsl.s, l: Math.max(0, baseHsl.l - 10) });
        return colors;
    }

    // Generates a triadic color palette.
    generateTriadicPalette(baseHsl) {
        const colors = [];
        colors.push(baseHsl); // Base color
        colors.push({ h: (baseHsl.h + 120) % 360, s: Math.max(0, baseHsl.s - 10), l: Math.min(100, baseHsl.l + 10) });
        colors.push({ h: (baseHsl.h + 240) % 360, s: Math.min(100, baseHsl.s + 10), l: Math.max(0, baseHsl.l - 10) });
        colors.push({ h: (baseHsl.h + 60) % 360, s: baseHsl.s, l: baseHsl.l });
        colors.push({ h: (baseHsl.h - 60 + 360) % 360, s: baseHsl.s, l: baseHsl.l });
        return colors;
    }

    // Generates a tetradic color palette.
    generateTetradicPalette(baseHsl) {
        const colors = [];
        colors.push(baseHsl); // Base color
        colors.push({ h: (baseHsl.h + 90) % 360, s: Math.max(0, baseHsl.s - 10), l: Math.min(100, baseHsl.l + 10) });
        colors.push({ h: (baseHsl.h + 180) % 360, s: baseHsl.s, l: baseHsl.l });
        colors.push({ h: (baseHsl.h + 270) % 360, s: Math.min(100, baseHsl.s + 10), l: Math.max(0, baseHsl.l - 10) });
        colors.push({ h: baseHsl.h, s: Math.max(0, baseHsl.s - 5), l: Math.min(100, baseHsl.l + 5) });
        return colors;
    }
}