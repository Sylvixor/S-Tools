import { Utils } from './modules/utils.js';
import { FileOperations } from './modules/file-operations.js';
import { UnitConverter } from './modules/unit-converter.js';
import { EncodeDecode } from './modules/encode-decode.js';
import { ColorUtilities } from './modules/color-utilities.js';

class App {
    constructor() {
        // Initialize utility and module instances
        this.utils = new Utils();
        this.fileOperations = new FileOperations(this.utils);
        this.unitConverter = new UnitConverter(this.utils);
        this.encodeDecode = new EncodeDecode(this.utils);
        this.colorUtilities = new ColorUtilities(this.utils);

        // Expose instances globally for direct HTML `onclick` calls
        window.fileOperations = this.fileOperations;
        window.unitConverter = this.unitConverter;
        window.encodeDecode = this.encodeDecode;
        window.colorUtilities = this.colorUtilities;

        this.setupGlobalEventListeners();
        this.initializeApplication();
    }

    //Initializes the application, setting up initial tab state and UI enhancements.
    initializeApplication() {
        // Set the initial active tab on page load
        const activeTabOnLoad = document.querySelector('.tab.active');
        if (activeTabOnLoad) {
            this.switchTab(activeTabOnLoad.dataset.tab, false); // No animation for initial load
        }

        // Initialize the color picker with its default value
        const colorInput = document.getElementById('colorPicker');
        if (colorInput) {
            this.colorUtilities.updateColorDisplay(colorInput.value);
        }

        // Add a subtle, occasional glitch effect to certain UI elements
        setInterval(() => {
            const interactiveElements = document.querySelectorAll('.file-item, .tab, .btn');
            const randomElement = interactiveElements[Math.floor(Math.random() * interactiveElements.length)];
            if (randomElement && Math.random() < 0.05) { // 5% chance to glitch
                randomElement.style.animation = 'glitch 0.3s ease';
                setTimeout(() => {
                    randomElement.style.animation = '';
                }, 300);
            }
        }, 8000);
    }

    // Sets up global event listeners, primarily for tab switching.
    setupGlobalEventListeners() {
        document.querySelectorAll('.tab').forEach(tabButton => {
            tabButton.addEventListener('click', (event) => {
                const targetTab = event.target.dataset.tab;
                this.switchTab(targetTab);
            });
        });
    }

    // Switches between different application tabs with optional animation.
    switchTab(tabName, animate = true) {
        const currentActiveContent = document.querySelector('.tab-content.active');
        const newContent = document.getElementById(tabName);
        const currentActiveButton = document.querySelector('.tab.active');
        const paletteDisplay = document.getElementById('paletteContainer');

        // If the clicked tab is already active, do nothing
        if (currentActiveButton && currentActiveButton.dataset.tab === tabName) {
            return;
        }

        // Update active tab button styling
        if (currentActiveButton) {
            currentActiveButton.classList.remove('active');
        }
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        if (currentActiveContent && animate) {
            // Handle specific fade-out for the color palette if switching from colors tab
            if (currentActiveContent.id === 'colors' && paletteDisplay) {
                paletteDisplay.classList.add('fade-out-down');
                paletteDisplay.classList.remove('fade-in-up');
            }

            // Apply fade-out animation to the current active tab content
            currentActiveContent.classList.add('fade-out-down');
            currentActiveContent.classList.remove('fade-in-up');
            
            // Wait for fade-out to complete before changing content and fading in new tab
            setTimeout(() => {
                currentActiveContent.classList.remove('active', 'fade-out-down');
                // Hide and clear palette content after its fade-out if coming from colors tab
                if (currentActiveContent.id === 'colors' && paletteDisplay) {
                    paletteDisplay.classList.remove('fade-out-down');
                    paletteDisplay.style.display = 'none';
                    paletteDisplay.innerHTML = ''; 
                }

                newContent.classList.add('active');
                if (animate) newContent.classList.add('fade-in-up');
                this.handleTabSpecificVisibility(tabName);
            }, 300);
        } else { 
            if (currentActiveContent) {
                currentActiveContent.classList.remove('active');
            }
            newContent.classList.add('active');
            if (animate) newContent.classList.add('fade-in-up');
            this.handleTabSpecificVisibility(tabName);
        }

        this.utils.updateStatus(`TAB: SWITCHED TO ${tabName.toUpperCase()}`);
    }

    // Handles specific visibility and initialization logic for each tab.
    handleTabSpecificVisibility(tabName) {
        const paletteDisplay = document.getElementById('paletteContainer');
        if (tabName === 'colors') {
            paletteDisplay.style.display = 'block';
            paletteDisplay.classList.add('fade-in-up');
            paletteDisplay.classList.remove('fade-out-down');
            const colorInput = document.getElementById('colorPicker');
            if (colorInput) {
                this.colorUtilities.updateColorDisplay(colorInput.value);
            }
        } else if (tabName === 'converter') {
            this.unitConverter.initializeConverterUnits();
        }
    }
}

// Initialize the application once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
});