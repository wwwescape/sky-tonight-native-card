import { AstroTime, EquatorialCoordinates, HorizontalCoordinates, ConstellationInfo, IlluminationInfo, Body, Observer, Equator, Horizon, Illumination, MoonPhase, Constellation, SearchRiseSet } from 'astronomy-engine';
import { defaults } from '../../config';
import { Coords, Options, ObjectData } from "../types/sky-tonight-native-card-types";

const NakedEyeObjects: Body[] = [
    Body.Sun, Body.Moon, Body.Mercury, Body.Venus, Body.Earth, Body.Mars, Body.Jupiter, Body.Saturn,
];

const IncludedBodies: Body[] = [
    Body.Sun, Body.Moon, Body.Mercury, Body.Venus, Body.Mars, Body.Jupiter, Body.Saturn, Body.Uranus, Body.Neptune, Body.Pluto
];

export class Sky {
    location: Observer;
    time: Date;

    constructor(opts: Options) {
        const options = Object.assign(
            {},
            defaults,
            ...Object.entries(opts).map(([k, v]) => v === undefined ? {} : { [k]: v })
        );
        this.location = new Observer(options.latitude, options.longitude, options.elevation);
        this.time = options.time;
    }

    private getDMS(x: number): Coords {
        const a: Coords = {
            negative: (x < 0),
            degrees: Math.floor(x),
            arcminutes: 0,
            arcseconds: 0,
        };

        if (a.negative) {
            x = -x;
        }

        a.arcminutes = Math.floor(x * 60) % 60;
        a.arcseconds = Math.round(10.0 * (x * 3600 - Math.floor(x * 3600))) / 10.0;

        return a;
    }

    private getHMS(x: number): Coords {
        const a: Coords = {
            negative: (x < 0),
            degrees: Math.floor(x),
            arcminutes: 0,
            arcseconds: 0,
        };

        if (a.negative) {
            x = -x;
        }

        a.degrees = Math.floor(x);
        a.arcminutes = Math.floor(x * 60) % 60;
        a.arcseconds = Math.round(10.0 * (x * 3600 - Math.floor(x * 3600))) / 10.0;

        return a;
    }

    private getStartOfDay(originalDate: Date): Date {
        const startOfDay = new Date(originalDate);
        // Set hours, minutes, seconds, and milliseconds to 0
        startOfDay.setHours(0, 0, 0, 0);

        return startOfDay;
    }

    private getMoonPhaseName(phaseValue: number): string {
        const phaseMappings = [
            { name: 'New Moon', range: [0, 45] },
            { name: 'Waxing Crescent', range: [45, 90] },
            { name: 'First Quarter', range: [90, 135] },
            { name: 'Waxing Gibbous', range: [135, 180] },
            { name: 'Full Moon', range: [180, 225] },
            { name: 'Waning Gibbous', range: [225, 270] },
            { name: 'Last Quarter', range: [270, 315] },
            { name: 'Waning Crescent', range: [315, 360] }
        ];

        const normalizedPhaseValue = (phaseValue % 360 + 360) % 360; // Normalize phase value to range between 0 and 359

        for (const mapping of phaseMappings) {
            const [minRange, maxRange] = mapping.range;
            if (normalizedPhaseValue >= minRange && normalizedPhaseValue < maxRange) {
                return mapping.name;
            }
        }

        return 'Unknown'; // If no matching range is found
    }

    get(options: { aboveHorizon?: boolean } = {}): ObjectData[] {
        const output: ObjectData[] = [];
        Object.keys(Body).filter(key => IncludedBodies.includes(key as Body)).forEach(bodyKey => {
            const body = Body[bodyKey as keyof typeof Body];
            const item: ObjectData = {
                name: body
            }
            
            const eq: EquatorialCoordinates = Equator(body, this.time, this.location, true, true);
            const hc: HorizontalCoordinates = Horizon(this.time, this.location, eq.ra, eq.dec, 'normal');
            const constellation: ConstellationInfo = Constellation(eq.ra, eq.dec);
            let rise: AstroTime = SearchRiseSet(body, this.location, +1, this.getStartOfDay(this.time), 300);
            let set: AstroTime = SearchRiseSet(body, this.location, -1, this.getStartOfDay(this.time), 300);

            // If the body has already set, get the next day's rise and set times
            if (set.date < this.time) {
                const nextDate = new Date(this.time);
                nextDate.setDate(nextDate.getDate() + 1);
                rise = SearchRiseSet(body, this.location, +1, this.getStartOfDay(nextDate), 300);
                set = SearchRiseSet(body, this.location, -1, this.getStartOfDay(nextDate), 300);
            }

            item.rise = rise.date;
            item.set = set.date;
            item.constellation = constellation.name;
            item.rightAscension = this.getHMS(hc.ra);
            item.declination = this.getDMS(hc.dec);
            item.rightAscension.raw = hc.ra;
            item.declination.raw = hc.dec;
            item.altitude = hc.altitude;
            item.azimuth = hc.azimuth;
            item.aboveHorizon = hc.altitude > 0 ? 'above_horizon' : 'below_horizon';

            if (body === Body.Moon) {
                const moonPhase = MoonPhase(this.time);
                const phase = (moonPhase / 360) * 100;
                item.phase = phase;
                item.phaseName = this.getMoonPhaseName(moonPhase);
            }

            const illumination: IlluminationInfo = Illumination(body, this.time)
            item.magnitude = illumination.mag

            item.nakedEyeObject = NakedEyeObjects.includes(body)

            if ((item.aboveHorizon && options.aboveHorizon) || !options.aboveHorizon) {
                output.push(item)
            }
        })

        return output
    }
}
