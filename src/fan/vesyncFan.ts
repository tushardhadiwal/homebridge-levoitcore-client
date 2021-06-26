export class VesyncFan {
    name: string;
    mode: string;
    speed: number;
    uuid: string;
    status: string;
    airQuality: string;
    deviceRegion: string;
    cid: string;
    configModule: string; 

    constructor(deviceData) {
        this.name = deviceData.deviceName;
        this.mode = deviceData.extension.mode;
        this.speed = deviceData.extension.fanSpeedLevel;
        this.airQuality = deviceData.extension.airQualityLevel;
        this.uuid = deviceData.uuid;
        this.status = deviceData.deviceStatus;
        this.configModule=deviceData.configModule;
        this.cid=deviceData.cid;
        this.deviceRegion=deviceData.deviceRegion;
    }
}



