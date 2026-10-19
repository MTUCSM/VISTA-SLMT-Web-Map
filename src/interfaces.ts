export interface MarkerData {
    visible:boolean;
    id: number;
    title: string;
    latitude: number;
    longitude: number;
    audioRadius: number;
    latitude_override?:number,
    longitude_override?:number,
    type?:string;
    image?: string;
    audio?: string;
    video?: string;
    source?: string;
    link?: string;
    description?: string;
    action?:string;
    musicians?:string;
    year?:string;
    location?:string;
}
export interface ActiveTrack {
    marker: MarkerData;

    audio: HTMLAudioElement;

    volume: number;

    playing: boolean;
}
export type MixerMode = "Active" | "Passive"
export type SidebarMode = "Info" | "Mixer" | "Form" | "Search"
export type SidebarVisibility = "Hidden" | "Visible"
export interface MixerSettings {
    volume:number,
    radius:number,
    autoplay:boolean
}
export const SearchFields = ["type", "action", "title", "musicians", "year", "location", "link", "source", "description"]
export const IgnoredTypes = ["Place name"] // only used in XR
export const EnumeratedFields:(keyof MarkerData)[] = ["type","action"]