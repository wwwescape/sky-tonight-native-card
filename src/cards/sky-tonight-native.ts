import { html, HTMLTemplateResult } from "lit-html";
import { BaseCard } from "./base-card";
import { HomeAssistant } from "custom-card-helpers";
import SkyTonightNativeCard from "..";
import { binocularsObjects, objects, ObjectTypes } from "../consts";
import { Sky } from '../api/sky';
import { ObjectData } from "../types/sky-tonight-native-card-types";

export default class SkyTonight extends BaseCard {
    hass: HomeAssistant;
    defaultTranslations = {
        'jan': 'Jan',
        'feb': 'Feb',
        'mar': 'Mar',
        'apr': 'Apr',
        'may': 'May',
        'jun': 'Jun',
        'jul': 'Jul',
        'aug': 'Aug',
        'sep': 'Sep',
        'oct': 'Oct',
        'nov': 'Nov',
        'dec': 'Dec',
        'above-horizon': 'Above Horizon',
        'below-horizon': 'Below Horizon',
        'sun': 'Sun',
        'mercury': 'Mercury',
        'venus': 'Venus',
        'moon': 'Moon',
        'mars': 'Mars',
        'jupiter': 'Jupiter',
        'saturn': 'Saturn',
        'uranus': 'Uranus',
        'neptune': 'Neptune',
        'pluto': 'Pluto',
        'star': 'Star',
        'planet': 'Planet',
        'dwarf-planet': 'Dwarf Planet',
        'visible-to-the-naked-eye': 'Visible to the naked eye',
        'visible-with-binoculars': 'Visible with binoculars',
        'visible-with-telescope': 'Visible with telescope',
        'nothing-to-see': 'Nothing to see',
        'no-stargazing-opportunities': 'No stargazing opportunities',
        'enjoy-your-stargazing': 'Enjoy your stargazing',
        'first-quarter': 'First Quarter',
        'full': 'Full Moon',
        'last-quarter': 'Last Quarter',
        'new': 'New Moon',
        'waning-cresent': 'Waning Cresent',
        'waning-gibbous': 'Waning Gibbous',
        'waxing-cresent': 'Waxing Cresent',
        'waxing-gibbous': 'Waxing Gibbous'
    };

    constructor(parent: SkyTonightNativeCard) {
        super(parent);
    }

    cardSize(): number {
        return 1;
    }

    translate(string: string): string {
        return this.translation(this.transformString(string));
    }

    formatDate(date: Date, remove: string[] = []) {
        const givenDate = new Date(date);
        const monthNames = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];

        const month = this.translate(monthNames[givenDate.getMonth()]);
        const day = this.padNumber(givenDate.getDate(), 2);
        const hour = this.padNumber(givenDate.getHours(), 2);
        const minute = this.padNumber(givenDate.getMinutes(), 2);

        const formattedDate = [];

        if (!remove.includes('month')) {
            formattedDate.push(month);
        }

        if (!remove.includes('day')) {
            formattedDate.push(day);
        }

        if (!remove.includes('time')) {
            formattedDate.push(`${hour}:${minute}`);
        }

        return formattedDate.join(' ');
    }

    padNumber(number: number, length: number): string {
        return String(number).padStart(length, '0');
    }

    isToday(date: Date): boolean {
        const givenDate = new Date(date);
        const today = new Date(); // Current date
        return (
            givenDate.getDate() === today.getDate() &&
            givenDate.getMonth() === today.getMonth() &&
            givenDate.getFullYear() === today.getFullYear()
        );
    }

    transformString(string: string): string {
        // Remove special characters using regular expression
        const stringWithoutSpecialChars = string.replace(/[^\w\s]/gi, '');

        // Replace spaces with hyphens
        const stringWithHyphens = stringWithoutSpecialChars.replace(/\s+/g, '-');

        // Convert the string to lowercase
        const lowercaseString = stringWithHyphens.toLowerCase();

        return lowercaseString;
    }

    render(): HTMLTemplateResult {

        const time = this.config.time ? new Date(this.config.time) : new Date();
        const latitude = this.config.latitude || this.hass.config.latitude;
        const longitude = this.config.longitude || this.hass.config.longitude;
        const elevation = this.config.elevation || this.hass.config.elevation;

        // Get API response
        const sky = new Sky({
            time,
            latitude,
            longitude,
            elevation,
        });

        const data: ObjectData[] = sky.get();

        const objectsData = Object.values(data).filter(
            (objectData: ObjectData) => {
                if (this.config.onlyAboveHorizon) {
                    return objectData.aboveHorizon === "above_horizon";
                } else {
                    return objectData;
                }
            }).sort((a: ObjectData, b: ObjectData) => {
                const indexA = objects.indexOf(a.name.toLowerCase());
                const indexB = objects.indexOf(b.name.toLowerCase());
                return indexA - indexB;
            });

        let riseDateTime: Date | undefined;
        let setDateTime: Date | undefined;
        let moonPhase;

        const objectsHTML: HTMLTemplateResult = html`${objectsData
            .map((object: ObjectData) => {
                const objectName = object.name;
                const objectType = ObjectTypes[objectName];
                const objectPosition = object.aboveHorizon === 'above_horizon' ? 'Above Horizon' : 'Below Horizon';
                const eyeIcon = object.aboveHorizon === 'above_horizon' && object.nakedEyeObject ? 'eye.png' : 'eye_disabled.png';
                const binocularsIcon = object.aboveHorizon === 'above_horizon' && binocularsObjects.includes(objectName) ? 'binoculars.png' : 'binoculars_disabled.png';
                const telescopeIcon = object.aboveHorizon === 'above_horizon' ? 'telescope.png' : 'telescope_disabled.png';

                if (this.isToday(object.rise) && (!riseDateTime || object.rise < riseDateTime)) {
                    riseDateTime = object.rise;
                }

                if (this.isToday(object.set) && (!setDateTime || object.set > setDateTime)) {
                    setDateTime = object.set;
                }

                if (objectName === "Moon") {
                    moonPhase = object.phaseName;
                }

                return html`
                    <div class="objects-container" id="sky_tonight_${this.transformString(object.name)}">
                        <div class="image-container">
                            <img src="/local/sky-tonight-native-card/images/objects/${this.translate(objectName)}.png" alt="${this.translate(objectName)}" />
                        </div>
                        <div class="info-container">
                            <div class="type-container">
                                <span class="object-type ${this.transformString(objectType)}">${this.translate(objectType)}</span>
                            </div>
                            <div class="name-container">
                                <span class="object-name">${this.translate(objectName)}</span>
                            </div>
                            <!-- <div class="position-container">
                                <span class="object-position">${this.translate(objectPosition)}</span>
                            </div> -->
                            <div class="position-container">
                                <span class="object-position">${this.formatDate(object.rise)} to ${this.formatDate(object.set)}</span>
                            </div>
                        </div>
                        <div class="icon-container">
                            <img src="/local/sky-tonight-native-card/images/${eyeIcon}" alt="${this.translate('Visible to the naked eye')}" />
                            <img src="/local/sky-tonight-native-card/images/${binocularsIcon}" alt="${this.translate('Visible with binoculars')}" />
                            <img src="/local/sky-tonight-native-card/images/${telescopeIcon}" alt="${this.translate('Visible with telescope')}" />
                        </div>
                    </div>`;
            })}`;

        const weatherEntity = this.config.weatherEntity
            ? this.hass.states[this.config.weatherEntity]
            : null;

        const weatherClear = weatherEntity?.state == "clear";

        let risetSetDateTime;

        if (riseDateTime && setDateTime) {
            risetSetDateTime = `${this.formatDate(riseDateTime, ['month', 'day'])} to ${this.formatDate(setDateTime, ['month', 'day'])}`;
        } else {
            risetSetDateTime = this.translate('Nothing to see');
        }

        const summaryHTML: HTMLTemplateResult = html`
            <div class="summary-container">
                <div class="text-container">
                    <span class="${!weatherClear ? "error-text" : ""}">${!weatherClear ? this.translate('No stargazing opportunities') : this.translate('Enjoy your stargazing')}</span>
                </div>
                <div class="icon-container">
                    <div>
                        <img src="/local/sky-tonight-native-card/images/clock.png" alt="${this.translate('Visible Times')}" />
                        <span class="icon-text">${risetSetDateTime}</span>
                    </div>
                    <div>
                        <img src="/local/sky-tonight-native-card/images/moon-phases/moon-${this.transformString(moonPhase)}.png" alt="${this.translate(moonPhase)}" />
                        <span class="icon-text">${this.translate(moonPhase)}</span>
                    </div>
                </div>
            </div>`;

        return html`${summaryHTML}${objectsHTML}`;
    }
}
