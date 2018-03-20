const controls = document.getElementById('controls');
const hideControls = document.getElementById('hideControls');
const picture = document.getElementById('picture');

const resolution = document.getElementById('resolution');
const widthSlider = document.getElementById('width');
const widthValue = document.getElementById('widthValue');
const hideRowLabels = document.getElementById('hideRowLabels');

const rowLabelColor = document.getElementById('rowLabelColor');
const rowLabelColorValue = document.getElementById('rowLabelColorValue');
const rowLabelHeight = document.getElementById('rowLabelHeight');
const rowLabelHeightValue = document.getElementById('rowLabelHeightValue');
const rowLabelAlignment1 = document.getElementById('rowLabelAlignment1');
const rowLabelAlignment2 = document.getElementById('rowLabelAlignment2');
const rowLabelAlignment3 = document.getElementById('rowLabelAlignment3');

const dataHeight = document.getElementById('dataHeight');
const dataHeightValue = document.getElementById('dataHeightValue');
const dataHorizontalPadding = document.getElementById('dataHorizontalPadding');
const dataHorizontalPaddingValue = document.getElementById('dataHorizontalPaddingValue');
const dataVerticalMargin = document.getElementById('dataVerticalMargin');
const dataVerticalMarginValue = document.getElementById('dataVerticalMarginValue');
const dataGutter = document.getElementById('dataGutter');
const dataGutterValue = document.getElementById('dataGutterValue');
const dataLabelHeight = document.getElementById('dataLabelHeight');
const dataLabelHeightValue = document.getElementById('dataLabelHeightValue');
const dataLabelAlignment1 = document.getElementById('dataLabelAlignment1');
const dataLabelAlignment2 = document.getElementById('dataLabelAlignment2');
const dataLabelAlignment3 = document.getElementById('dataLabelAlignment3');
const dataCropLabels = document.getElementById('dataCropLabels');
const hideLabelIfTooLong = document.getElementById('hideLabelIfTooLong');

const markerLabelColor = document.getElementById('markerLabelColor');
const markerLabelColorValue = document.getElementById('markerLabelColorValue');
const markerLabelHeight = document.getElementById('markerLabelHeight');
const markerLabelHeightValue = document.getElementById('markerLabelHeightValue');
const markerMargin = document.getElementById('markerMargin');
const markerMarginValue = document.getElementById('markerMarginValue');
const markerFormat1 = document.getElementById('markerFormat1');
const markerFormat2 = document.getElementById('markerFormat2');
const markerCustomFormat = document.getElementById('markerCustomFormat');

const resetConfig = document.getElementById('resetConfig');
const data = document.getElementById('data');

const inputsAndValues = [
    resolution, null,
    widthSlider, widthValue,
    hideRowLabels, null,

    rowLabelColor, rowLabelColorValue,
    rowLabelHeight, rowLabelHeightValue,
    rowLabelAlignment1, null,
    rowLabelAlignment2, null,
    rowLabelAlignment3, null,

    dataHeight, dataHeightValue,
    dataLabelHeight, dataLabelHeightValue,
    dataHorizontalPadding, dataHorizontalPaddingValue,
    dataVerticalMargin, dataVerticalMarginValue,
    dataGutter, dataGutterValue,
    dataLabelAlignment1, null,
    dataLabelAlignment2, null,
    dataLabelAlignment3, null,
    dataCropLabels, null,
    hideLabelIfTooLong, null,

    markerLabelHeight, markerLabelHeightValue,
    markerLabelMargin, markerLabelMarginValue,
    markerLabelColor, markerLabelColorValue,
    markerFormat1, null,
    markerFormat2, null,
    markerCustomFormat, null
];

let w = 16;
let h = 0;

let canvas;
let table;
let rescaled;
let config;

function setup() {
    config = extend(getConfig(), Timeline.getDefaultConfig());

    timeline = new Timeline(config);

    let storedData = getData();
    data.innerHTML = storedData;
    timeline.parse(storedData);
    canvas = createCanvas(timeline.width(), timeline.height());
    canvas.parent('picture');
    noLoop();

    // Rescale on click
    rescaled = true;
    canvas.elt.addEventListener('click', function() {
        rescaled = !rescaled;
        resizeAndRedraw();
    });

    // Redraw on resize
    window.addEventListener('resize', function() {
        rescale();
    });

    // Show/hide controls
    hideControls.addEventListener('click', function() {
      let classNames = controls.className.split(' ');
      
      if (classNames.includes('hidden')) {
        controls.className = classNames.filter(s => s !== 'hidden').join(' ');
        picture.className = picture.className.split(' ').filter(s => s !== 'whole').join(' ');
      }
      else {
        controls.className += ' hidden';
        picture.className += ' whole';
      }
    });

    // Show/hide control sections
    let sections = document.querySelectorAll('#controls section');
    for (const section of sections) {
        let header = null;
        for (const child of section.childNodes) {
            if (child.tagName && child.tagName === 'H2') {
                header = child;
                break;
            }
        }
        if (!header) continue;
        section.className += 'hidden';
        header.addEventListener('click', function(e) {
            let sections = document.querySelectorAll('#controls section');
            let parent = e.currentTarget.parentElement;
            for (const section of sections) {
                if (section === parent) {
                    if (section.className.split(' ').includes('hidden'))
                        section.className = section.className.split(' ').filter(s => s !== 'hidden').join(' ');
                    else
                        section.className += ' hidden';
                }
                else {
                    if (!section.className.split(' ').includes('hidden'))
                        section.className += ' hidden';
                }
            }
        });
    }

    // Set config values
    setValuesFromConfig();

    // Show values
    for (let i = 0; i < inputsAndValues.length; i += 2) {
        const updateValue = (function(target) {
            return function() {
                if (target) {
                    target.innerHTML = this.value;
                }
                let value;
                switch (this.type) {
                    case 'radio':
                        value = this.checked ? this.value : config[this.name];
                        break;
                    case 'checkbox':
                        value = this.checked;
                        break;
                    default:
                        value = this.value;
                        break;
                }
                config[this.name] = value;
                saveConfig(config);
                resizeAndRedraw();
            };
        })(inputsAndValues[i+1]);
        inputsAndValues[i].addEventListener('input', updateValue);
        inputsAndValues[i].addEventListener('change', updateValue);
        inputsAndValues[i].dispatchEvent(new Event('change'));
    }

    // Reset button
    resetConfig.addEventListener('click', function() {
        config = Timeline.getDefaultConfig();
        setValuesFromConfig();
        saveConfig(config);
        resizeAndRedraw();
    });

    // Set data
    data.addEventListener('change', function() {
        timeline.clearData();
        timeline.parse(this.value);

        saveData(this.value);
        resizeAndRedraw();
    });

    markerFormat1.addEventListener('change', e => {
        markerCustomFormat.disabled = true;
    });
    markerFormat2.addEventListener('change', e => {
        markerCustomFormat.disabled = false;
    });
    markerCustomFormat.disabled = !markerFormat2.checked;
}

function setValuesFromConfig() {
    for (let i = 0; i < inputsAndValues.length; i += 2) {
        let input = inputsAndValues[i];
        
        if (!config.hasOwnProperty(input.name)) continue;

        switch(input.type) {
            case 'checkbox':
                input.checked = config[input.name]
                break;
            case 'radio':
                if (input.value === config[input.name])
                    input.checked = true;
                break;
            default:
                input.value = config[input.name];
                break;
        }
    }
}

function getConfig() {
    let res = localStorage.getItem('config');
    if (res) return JSON.parse(res);
    return {};
}

function saveConfig(config) {
    localStorage.setItem('config', JSON.stringify(config));
}

function getData(data) {
    return localStorage.getItem('data') || '';
}

function saveData(data) {
    localStorage.setItem('data', data);
}

function setTimelineConfig() {
    let clone = extend({}, config);
    clone.width *= clone.resolution;

    if (clone.markerFormat === 'default') {
        clone.markerCustomFormat = null;
    }

    timeline.set(clone);
}

function resizeAndRedraw() {
    setTimelineConfig();
    resizeCanvas(timeline.width(), timeline.height());
}

function draw() {
    clear();

    setTimelineConfig();
    timeline.draw();

    rescale();
}

function rescale() {
    let pictureWidth = parseInt(window.getComputedStyle(picture, null).getPropertyValue('width'));
    let canvasWidth = timeline.width();
    let taller = pictureWidth < canvasWidth;

    canvas.elt.style.width = taller && rescaled ? "100%" : 'auto';
    canvas.elt.style.height = 'auto';

    recenterCanvas();
}

function recenterCanvas() {
    let top = parseInt(window.getComputedStyle(picture, null).getPropertyValue('height')) / 2;
    top -= parseInt(window.getComputedStyle(canvas.elt, null).getPropertyValue('height')) / 2;
    top = top < 0 ? 0 : top;

    canvas.elt.style.top = top + 'px';
}