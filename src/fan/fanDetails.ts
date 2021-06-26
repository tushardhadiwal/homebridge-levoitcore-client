export type FanSpeed = 1 | 2 | 3 | 4;
export type FanMode = 'auto' | 'manual' | 'sleep';

export interface FanDetails {
    mode: FanMode;
    enabled: boolean;
    display: boolean;
    child_lock : boolean;
    level: FanSpeed;
    air_quality: number; 
    air_quality_value: number;
    filter_life : number;

}