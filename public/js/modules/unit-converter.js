import { Utils } from './utils.js';

export class UnitConverter {
    constructor(utils) {
        this.conversionUnits = {};
        this.utils = utils;
        this.initializeConverterUnits();
        this.setupUnitConversionListeners();
    }

    // Sets up event listeners for unit conversion inputs and category selection.
    setupUnitConversionListeners() {
        document.getElementById('converterFromUnit').addEventListener('change', () => this.performUnitConversion());
        document.getElementById('converterToUnit').addEventListener('change', () => this.performUnitConversion());
        document.getElementById('converterInput').addEventListener('input', () => this.performUnitConversion());

        document.getElementById('converterCategory').addEventListener('change', (e) => {
            this.populateUnitDropdowns(e.target.value);
            this.performUnitConversion(); // Re-convert after category change
        });
    }

    // Defines and initializes the available unit conversion categories and their factors.
    initializeConverterUnits() {
        this.conversionUnits = {
            time: {
                baseUnit: 'seconds',
                units: {
                    milliseconds: 0.001,
                    seconds: 1,
                    minutes: 60,
                    hours: 3600,
                    days: 86400,
                    weeks: 604800,
                    months: 2629746,
                    years: 31556952
                }
            },
            length: {
                baseUnit: 'meters',
                units: {
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
                baseUnit: 'grams',
                units: {
                    milligrams: 0.001,
                    grams: 1,
                    kilograms: 1000,
                    ounces: 28.3495,
                    pounds: 453.592,
                    tonnes: 1e6
                }
            },
            temperature: {
                baseUnit: 'celsius',
                units: {
                    celsius: { toBase: (val) => val, fromBase: (val) => val },
                    fahrenheit: { toBase: (val) => (val - 32) * 5/9, fromBase: (val) => (val * 9/5) + 32 },
                    kelvin: { toBase: (val) => val - 273.15, fromBase: (val) => val + 273.15 }
                }
            },
        };

        // Populate dropdowns with default category (time)
        this.populateUnitDropdowns('time');
    }

    // Populates the 'from' and 'to' unit dropdowns based on the selected category.
    populateUnitDropdowns(categoryName) {
        const fromUnitSelectElement = document.getElementById('converterFromUnit');
        const toUnitSelectElement = document.getElementById('converterToUnit');
        const unitsInSelectedCategory = this.conversionUnits[categoryName].units;

        // Clear previous options
        fromUnitSelectElement.innerHTML = '';
        toUnitSelectElement.innerHTML = '';

        for (const unitKey in unitsInSelectedCategory) {
            const optionForFrom = document.createElement('option');
            optionForFrom.value = unitKey;
            optionForFrom.textContent = unitKey.charAt(0).toUpperCase() + unitKey.slice(1);
            fromUnitSelectElement.appendChild(optionForFrom);

            const optionForTo = document.createElement('option');
            optionForTo.value = unitKey;
            optionForTo.textContent = unitKey.charAt(0).toUpperCase() + unitKey.slice(1);
            toUnitSelectElement.appendChild(optionForTo);
        }

        // Set default selections to the first two units in the category
        const firstUnit = Object.keys(unitsInSelectedCategory)[0];
        const secondUnit = Object.keys(unitsInSelectedCategory)[1];
        fromUnitSelectElement.value = firstUnit;
        toUnitSelectElement.value = secondUnit;
    }

    // Performs the unit conversion based on user input and selected units.
    performUnitConversion() {
        const inputValue = parseFloat(document.getElementById('converterInput').value);
        const sourceUnit = document.getElementById('converterFromUnit').value;
        const targetUnit = document.getElementById('converterToUnit').value;
        const outputField = document.getElementById('converterOutput');

        // Clear output and show error if input is invalid or empty
        if (isNaN(inputValue) || document.getElementById('converterInput').value.trim() === '') {
            outputField.value = '';
            if (document.getElementById('converterInput').value.trim() !== '') {
                this.utils.updateStatus('CONVERTER: ERROR: INVALID INPUT');
            }
            return;
        }

        let conversionResult;
        let detectedCategory;

        // Determine the category based on the source unit
        for (const categoryKey in this.conversionUnits) {
            if (this.conversionUnits[categoryKey].units[sourceUnit]) {
                detectedCategory = categoryKey;
                break;
            }
        }

        if (!detectedCategory) {
            outputField.value = 'Error';
            this.utils.updateStatus('CONVERTER: ERROR: UNKNOWN UNIT');
            return;
        }

        const categoryUnitData = this.conversionUnits[detectedCategory].units;

        if (detectedCategory === 'temperature') {
            // Temperature conversions require specific formulas
            const toBaseFunction = categoryUnitData[sourceUnit].toBase;
            const fromBaseFunction = categoryUnitData[targetUnit].fromBase;

            const valueInBase = toBaseFunction(inputValue);
            conversionResult = fromBaseFunction(valueInBase);
        } else {
            // Linear conversions: convert to base unit, then from base unit to target
            const valueInBase = inputValue * categoryUnitData[sourceUnit];
            conversionResult = valueInBase / categoryUnitData[targetUnit];
        }

        outputField.value = conversionResult.toFixed(4);
        this.utils.updateStatus(`CONVERTER: CONVERTED ${inputValue} ${sourceUnit.toUpperCase()} TO ${conversionResult.toFixed(4)} ${targetUnit.toUpperCase()}`);
    }
}