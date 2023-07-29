import { HomeAssistant, LovelaceCardConfig } from 'custom-card-helpers';

export interface SkyTonightNativeCardConfig extends LovelaceCardConfig {
    title?: string;
    latitude?: number;
    longitude?: number;
    elevation?: number;
    time?: string;
    showSun?: boolean;
    onlyAboveHorizon?: boolean;
    weatherEntity?: string;
    hass?: HomeAssistant;
}

export interface ValueChangedEvent {
    detail: {
        value: {
            itemValue: string;
            parentElement: {
                configValue: string;
            };
        }
    };
    target: {
        value: string;
        configValue: string;
        checked?: boolean;
    };

}

export interface Translation {
    [key: string]: string;
}

export interface LocalStorageItem {
    data: string,
    created: Date
}

export interface CardProperties {
    [key: string]: unknown;
}

export interface SelectChangeEvent {
    target: {
        value: string;
    }
}

export interface Coords {
    negative: boolean;
    degrees: number;
    arcminutes: number;
    arcseconds: number;
    raw?: number;
}

export interface Options {
    time: Date;
    latitude: number;
    longitude: number;
    elevation: number;
}

export interface ObjectData {
    name: string;
    aboveHorizon?: string;
    nakedEyeObject?: boolean;
    rise?: Date;
    set?: Date;
    phaseName?: string;
    constellation?: string;
    rightAscension?: Coords;
    declination?: Coords;
    altitude?: number;
    azimuth?: number;
    phase?: number;
    magnitude?: number;
}