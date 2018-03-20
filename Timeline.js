function colorFromName(name) {
    let sum = [...name].reduce((a, b) => {
        return a * 2 + b.charCodeAt(0);
    }, 0);

    let r = (sum * 3) % 125 + 64;

    sum = [...name].reduce((a, b) => {
        return a * 5 + b.charCodeAt(0);
    }, 0);
    let g = (sum * 5) % 125 + 64;

    sum = [...name].reduce((a, b) => {
        return a * 7 + b.charCodeAt(0);
    }, 0);
    let b = (sum * 9) % 125 + 64;

    return color(r, g, b);
}

function getColor(name) {
    if (getColor.names === undefined) getColor.names = [];
    if (getColor.id === undefined) getColor.id = 0;
    if (getColor.colors === undefined) {
        getColor.colors = [
            color('#4285f4'),
            color('#db4437'),
            color('#f4b400'),
            color('#0f9d58'),
            color('#ab47bc'),
            color('#00acc1'),
            color('#ff7043'),
            color('#9e9d24'),
            color('#5c6bc0'),

            color('#5e97f5'),
            color('#e06055'),
            color('#f5bf26'),
            color('#33ab71'),
            color('#b762c6'),
            color('#26b8ca'),
            color('#ff855f'),
            color('#acab44'),
            color('#7481c9'),

            color('#76a6f7'),
            color('#e4776e'),
            color('#f7c846'),
            color('#51b886'),
            color('#c27ace'),
            color('#46c3d2'),
            color('#ff9777'),
            color('#b8b860'),
            color('#8994d1')
        ];
    }

    if (getColor.names[name] === undefined) {
        getColor.names[name] = getColor.id++ % getColor.colors.length;
    }

    return getColor.colors[getColor.names[name]];
}

function resetColors() {
    getColor.names = [];
    getColor.id = 0;
}

function extend(a, b) {
    for (const p in b) {
        if (!a.hasOwnProperty(p)) {
            a[p] = b[p];
        }
    }
    return a;
}

class Timeline {
    
    constructor(config) {
        this.rows = [];

        this.set(extend(config, this.getDefaultConfig()));

        this.markersCreatedManually = this.markers() !== undefined;

        /*
        this.markers = [
            new Marker(new Date(1812,0,1), 'YYYY'),
            new Marker(new Date(1815,0,1), 'YYYY'),
            new Marker(new Date(1819,0,1), 'YYYY'),
            new Marker(new Date(1832,0,1), 'YYYY'),
            new Marker(new Date(1833,0,1), 'YY'),
            new Marker(new Date(1835,0,1), 'YY'),
            new Marker(new Date(1838,0,1), 'YYYY'),
            new Marker(new Date(1839,0,1), 'YY'),
            new Marker(new Date(1843,0,1), 'YYYY'),
            new Marker(new Date(1848,0,1), 'YYYY'),
            new Marker(new Date(1850,0,1), 'YYYY'),
            new Marker(new Date(1853,0,1), 'YYYY')
        ];
        */
    }

    createMarkers() {
        let start = this.getStartingDate();
        let end = this.getEndingDate();

        if (!start || !end) return [];
        start = start.clone();

        let duration = moment.duration(end.diff(start));

        let markerFrequency = 1;
        let markerUnit;
        if (duration.asYears() >= 3) {
            if (duration.asYears() >= 200) {
                markerFrequency = 100;
            } else if (duration.asYears() >= 100) {
                markerFrequency = 50;
            } else if (duration.asYears() >= 20) {
                markerFrequency = 10;
            } else if (duration.asYears() >= 10) {
                markerFrequency = 5;
            }
            markerUnit = 'year';
            this.markerFormat('YYYY');
        } else if (duration.asMonths() >= 3) {
            markerUnit = 'month';
            this.markerFormat('MMMM YYYY');
        } else if (duration.asDays() >= 3) {
            markerUnit = 'days';
            this.markerFormat('DD MMMM YYYY');
        } else if (duration.asHours() >= 3) {
            markerUnit = 'hours';
            this.markerFormat('HH:MM');
        }

        let markers = [];
        start.startOf(markerFrequency);
        if (markerUnit === 'year') {
            start.year(start.year() - start.year() % markerFrequency + markerFrequency);
        }
        let format = this.markerCustomFormat();
        if (!format) format = this.markerFormat();
        while(start.isSameOrBefore(end, markerUnit)) {
            let marker = new Marker(start, format);
            markers.push(marker);
            start.add(markerFrequency, markerUnit);
        }
        return markers;
    }

    hasRowFixedColor(label) {
        let colorByRowLabel = this.colorByRowLabel();

        if (typeof(colorByRowLabel) === 'boolean')
            return colorByRowLabel;

        return colorByRowLabel.includes(label);
    }

    getDefaultConfig() {
        return Timeline.getDefaultConfig();
    }

    static getDefaultConfig() {
        return {
            // General
            resolution: 72,
            width: 1500,
            hideRowLabels: false,

            // Row label
            rowLabelAlignment: RIGHT,
            rowLabelColor: "#4d4d4d",
            rowLabelHeight: 0.24,

            // Timelines
            dataLabelAlignment: LEFT,
            dataHeight: 0.31944,
            dataGutter: 0.09722,
            dataLabelHeight: 0.22,
            dataHorizontalPadding: 0.13888,
            dataVerticalMargin: 0.11111,
            dataCropLabels: true,

            // Markers
            markerLabelColor: "#4d4d4d",
            markerLabelHeight: 0.12,
            markerLabelMargin: 0.13888,
            markerCustomFormat: null,

            margin: 0.11111,
            borderWidth: 0.01388,
            colorByRowLabel: false,
            hideLabelIfTooLong: true,

            borderColor: "#9a9a9a",
            oddBackgroundColor: "#ffffff",
            evenBackgroundColor: "#e6e6e6",
            oddSeparationColor: "#e6e6e6",
            evenSeparationColor: "#ffffff"
        };
    }

    set(config) {
        for (let p in config) {
            if (this.__proto__.hasOwnProperty(p)) {
                this.__proto__[p].call(this, config[p]);
            }
        }
    }

    clearData() {
        this.rows = [];
    }

    addRows(data) {
        for (const row of data) {
            this.addRow(...row);
        }
    }

    addRow(rowLabel, label, from, to) {
        let row = this.hasRow(rowLabel);
        if (row === null) {
            row = this.createRow(rowLabel);
        }
        row.addData(label, from, to);
        return row;
    }

    hasRow(rowLabel) {
        for (const row of this.rows) {
            if (row.label === rowLabel)
                return row;
        }
        return null;
    }

    createRow(rowLabel) {
        this.rows.push(new Row(rowLabel));
        return this.rows[this.rows.length - 1];
    }

    parse(rawData) {
        let a = rawData.split('\n');
        a = a.map(s => s.split(','));
        for (const row of a) {
            for (let i = row.length - 2; i >= 0; i--) {
                if (row[i].charAt(row[i].length - 1) === '\\') {
                    if (row[i].length >= 2 && row[i].charAt(row[i].length - 2) === '\\') {
                        row[i] = row[i].slice(0, row[i].length - 1);
                        continue;
                    }
                    row[i] = row[i].slice(0, row[i].length - 1) + ',' + row[i+1];
                    row.splice(i + 1, 1);
                }
            }
        }
        a = a.filter(row => row.length === 8);
        a = a.map(row => {
            return [
                row[0],
                row[1],
                moment(new Date(row[2], row[3] - 1, row[4])),
                moment(new Date(row[5], row[6] - 1, row[7]))
            ];
        });

        this.addRows(a);
    }

    draw() {
        let labelWidth = this.getLongestLabelWidth();
        let labelBoxWidth = this.hideRowLabels() ? 0 : labelWidth + 2 * this.margin();
        let dataBoxWidth = this.hideRowLabels() ? this.width() : this.width() - labelBoxWidth;

        let offsetY = 0;

        if (!this.markersCreatedManually) {
            this.markers(this.createMarkers());
        }
        let markers = this.markers();

        resetColors();

        for (let i = 0; i < this.rows.length; i++) {
            let row = this.rows[i];
            let rowHeight = this.getRowHeight(row.subrows.length);

            // Background
            fill((i + 1) % 2 ? this.oddBackgroundColor() : this.evenBackgroundColor());
            noStroke();
            rect(0, offsetY, this.width(), rowHeight);

            // Label text
            if (!this.hideRowLabels()) {
                textSize(this.rowLabelHeight());
                noStroke();
                fill(this.rowLabelColor());
                let labelX;
                switch (this.rowLabelAlignment()) {
                  case LEFT:
                    labelX = this.margin();
                    break;
                  case CENTER:
                    labelX = labelWidth / 2 + this.margin();
                    break;
                  case RIGHT:
                  default:
                    labelX = labelWidth + this.margin();
                    break;
                }
                textAlign(this.rowLabelAlignment(), CENTER);
                text(row.label, labelX, offsetY + rowHeight / 2);
            }

            // Draw marks
            strokeWeight(this.borderWidth());
            for (const marker of markers) {
                let x = labelBoxWidth + (marker.diff(this.getStartingDate(), 'days') / this.getPeriodLength()) * dataBoxWidth;

                stroke((i + 1) % 2 ? this.oddSeparationColor() : this.evenSeparationColor());
                line(x, offsetY, x, offsetY + rowHeight);
            }

            // Timelines
            for (let j = 0; j < row.subrows.length; j++) {
                let subrow = row.subrows[j];
                for (const data of subrow) {
                    let ratio = data.diff() / this.getPeriodLength();
                    let length = ratio * dataBoxWidth;
                    let offsetX = (data.from.diff(this.getStartingDate(), 'days') / this.getPeriodLength()) * dataBoxWidth;

                    // Draw box
                    let fillColor = getColor(this.colorByRowLabel() ? row.label : data.label);
                    noStroke();
                    fill(fillColor);
                    //console.log(fillColor + " => hsv(" + hue(fillColor) + ',' + saturation(fillColor) + ',' + brightness(fillColor) + ')');
                    rect(labelBoxWidth + offsetX,
                        offsetY + this.dataVerticalMargin() + j * (this.dataHeight() + this.dataGutter()),
                        length,
                        this.dataHeight());

                    // Draw text
                    let str = data.label;
                    textSize(this.dataLabelHeight());
                    fill(brightness(fillColor) + saturation(fillColor) > 190 ? 0 : 255);

                    if (this.dataCropLabels()) {
                        if (textWidth(str) > length - this.dataHorizontalPadding() * 2) {
                            while(str.length > 1 && textWidth(str + '...') > length - this.dataHorizontalPadding() * 2)
                                str = str.substr(0, str.length - 1);

                            if (textWidth(str + '...') <= length - this.dataHorizontalPadding() * 2)
                                str += '...';
                        }
                    }

                    if (this.hideLabelIfTooLong() && textWidth(str) > length - this.dataHorizontalPadding() * 2) {
                        continue;
                    }

                    let dataLabelX = labelBoxWidth + offsetX;
                    if (length <= this.dataHorizontalPadding() * 2 + textWidth(str)) {
                        textAlign(CENTER, CENTER);
                        dataLabelX += length / 2;
                    }
                    else {
                        textAlign(this.dataLabelAlignment(), CENTER);
                        switch (this.dataLabelAlignment()) {
                          case RIGHT:
                            dataLabelX += length - this.dataHorizontalPadding();
                            break;
                          case CENTER:
                            dataLabelX += length / 2;
                            break;
                          case LEFT:
                          default:
                            dataLabelX += this.dataHorizontalPadding();
                            break;
                        }
                    }

                    text(str,
                        dataLabelX,
                        offsetY + this.dataVerticalMargin() + this.dataHeight() / 2 + j * (this.dataHeight() + this.dataGutter()))
                }
            }

            // Label right border
            if (!this.hideRowLabels()) {
                stroke((i + 1) % 2 ? this.oddSeparationColor() : this.evenSeparationColor());
                strokeWeight(this.borderWidth());
                line(labelWidth + 2 * this.margin(), offsetY, labelWidth + 2 * this.margin(), offsetY + rowHeight);
            }

            // Border
            noFill();
            stroke(this.borderColor());
            strokeWeight(this.borderWidth());
            rect(0, offsetY, this.width(), rowHeight);

            offsetY += rowHeight;
        }

        // Draw marker labels
        fill(this.markerLabelColor());
        noStroke();
        textAlign(CENTER, TOP);
        textSize(this.markerLabelHeight());
        for (const marker of markers) {
            let str = marker.toString();

            let x = labelBoxWidth + (marker.diff(this.getStartingDate(), 'days') / this.getPeriodLength()) * dataBoxWidth;
            x = max(textWidth(str) / 2, x);
            x = min(this.width() - textWidth(str) / 2, x);

            text(str, x, offsetY + this.markerLabelMargin());
        }
    }

    // Properties

    resolution(val) {
        if (val === undefined)
            return this._resolution;

        this._resolution = val;
    }

    hideRowLabels(val) {
        if (val === undefined)
            return this._hideRowLabels;

        this._hideRowLabels = val;
    }

    margin(val) {
        if (val === undefined)
            return this._margin * this._resolution;

        this._margin = val;
    }

    borderWidth(val) {
        if (val === undefined)
            return this._borderWidth * this._resolution;

        this._borderWidth = val;
    }

    oddSeparationColor(val) {
        if (val === undefined)
            return this._oddSeparationColor;

        this._oddSeparationColor = color(val);
    }

    evenSeparationColor(val) {
        if (val === undefined)
            return this._evenSeparationColor;

        this._evenSeparationColor = color(val);
    }

    oddBackgroundColor(val) {
        if (val === undefined)
            return this._oddBackgroundColor;

        this._oddBackgroundColor = color(val);
    }

    evenBackgroundColor(val) {
        if (val === undefined)
            return this._evenBackgroundColor;

        this._evenBackgroundColor = color(val);
    }

    borderColor(val) {
        if (val === undefined)
            return this._borderColor;

        this._borderColor = color(val);
    }

    colorByRowLabel(val) {
        if (val === undefined)
            return this._colorByRowLabel;

        this._colorByRowLabel = val;
    }

    // Row label

    rowLabelColor(val) {
        if (val === undefined)
            return this._rowLabelColor;

        this._rowLabelColor = color(val);
    }

    rowLabelHeight(val) {
        if (val === undefined)
            return this._rowLabelHeight * this._resolution;

        this._rowLabelHeight = val;
    }

    rowLabelAlignment(val) {
        if (val === undefined)
            return this._rowLabelAlignment;

        this._rowLabelAlignment = val;
    }

    // Timelines

    dataHeight(val) {
        if (val === undefined)
            return this._dataHeight * this._resolution;

        this._dataHeight = val;
    }

    dataLabelHeight(val) {
        if (val === undefined)
            return this._dataLabelHeight * this._resolution;

        this._dataLabelHeight = val;
    }

    dataHorizontalPadding(val) {
        if (val === undefined)
            return this._dataHorizontalPadding * this._resolution;

        this._dataHorizontalPadding = val;
    }

    dataVerticalMargin(val) {
        if (val === undefined)
            return this._dataVerticalMargin * this._resolution;

        this._dataVerticalMargin = val;
    }

    dataLabelAlignment(val) {
        if (val === undefined)
            return this._dataLabelAlignment;

        this._dataLabelAlignment = val;
    }

    dataGutter(val) {
        if (val === undefined)
            return this._dataGutter * this._resolution;

        this._dataGutter = val;
    }

    dataCropLabels(val) {
        if (val === undefined)
            return this._dataCropLabels;

        this._dataCropLabels = val;
    }

    hideLabelIfTooLong(val) {
        if (val === undefined)
            return this._hideLabelIfTooLong;

        this._hideLabelIfTooLong = val;
    }

    // Markers

    markerLabelColor(val) {
        if (val === undefined)
            return this._markerLabelColor;

        this._markerLabelColor = color(val);
    }

    markerLabelHeight(val) {
        if (val === undefined)
            return this._markerLabelHeight * this._resolution;

        this._markerLabelHeight = val;
    }

    markerLabelMargin(val) {
        if (val === undefined)
            return this._markerLabelMargin * this._resolution;

        this._markerLabelMargin = val;
    }

    markerFormat(val) {
        if (val === undefined)
            return this._markerFormat;

        this._markerFormat = val;
    }

    markerCustomFormat(val) {
        if (val === undefined)
            return this._markerCustomFormat;

        this._markerCustomFormat = val;
    }

    // Getters

    width(val) {
        if (val === undefined)
            return this._width;

        this._width = val;
    }

    height() {
        let sum = 0;

        for (const row of this.rows) {
            sum += this.getRowHeight(row.subrows.length);
        }

        return sum + this.markerLabelHeight() + this.markerLabelMargin();
    }

    markers(val) {
        if (val === undefined)
            return this._markers;

        this._markers = val;
    }

    getLongestLabelWidth() {
        let max = 0;
        textSize(this.rowLabelHeight());

        for (const row of this.rows) {
            let text = row.label;
            let w = textWidth(text);
            if (w > max) {
                max = w;
            }
        }
        return max;
    }

    getRowHeight(subrows) {
        return this.dataHeight() * subrows +
            this.dataGutter() * (subrows - 1) +
            this.dataVerticalMargin() * 2;
    }

    getRow(labelOrId) {
        if (typeof labelOrId === 'number')
            return this.rows[labelOrId] || null;

        return this.hasRow(rowLabel);
    }

    getStartingDate() {
        if (this.rows.length === 0)
            return null;

        let date = this.rows[0].first().from;
        for (let i = 1; i < this.rows.length; i++) {
            if (date.isAfter(this.rows[i].first().from))
                date = this.rows[i].first().from;
        }
        return date;
    }

    getEndingDate() {
        if (this.rows.length === 0)
            return null;

        let date = this.rows[0].last().to;
        for (let i = 1; i < this.rows.length; i++) {
            if (date.isBefore(this.rows[i].last().to))
                date = this.rows[i].last().to;
        }
        return date;
    }

    getPeriodLength(unit) {
        if (unit === undefined) unit = 'days';

        return this.getEndingDate().diff(this.getStartingDate(), unit);
    }

}

class Row {

    constructor(label) {
        this.label = label;
        this.subrows = [];

        this._first = null;
        this._last = null;
    }

    addData(label, from, to) {
        let data = new Data(label, from, to)
        let datas = [].concat(...this.subrows);
        datas.push(data);

        this.buildSubrows(datas);
    }

    buildSubrows(datas) {
        datas.sort((a, b) => {
            if (a.to.isSameOrBefore(b.from))
                return -1;
            if (a.from.isSameOrAfter(b.to))
                return 1;
            return 0;
        });
        this._first = datas[0];
        this._last = datas[0];

        this.subrows = [];
        for (const data of datas) {
            let newSubrowNeeded = true;
            for (const subrow of this.subrows) {
                if (data.from.isSameOrAfter(subrow[subrow.length - 1].to)) {
                    newSubrowNeeded = false;
                    subrow.push(data);
                    break;
                }
            }
            if (newSubrowNeeded) {
                let newSubrow = [data];
                this.subrows.push(newSubrow);
            }
            if (data.from.isBefore(this._first.from)) {
                this._first = data;
            }
            if (data.to.isAfter(this._last.to)) {
                this._last = data;
            }
        }
    }

    first() {
        return this._first;
    }

    last() {
        return this._last;
    }

}

class Data {

    constructor(label, from, to) {
        this.label = label;
        this.from = from;
        this.to = to;
    }

    diff(unit) {
        if (unit === undefined) unit = "days";

        return this.to.diff(this.from, unit);
    }

}

class Marker {

    constructor(date, format) {
        this.format = format;
        this.date = moment(date);
    }

    toString() {
        return this.date.format(this.format);
    }

    diff() {
        return this.date.diff(...arguments);
    }

}