import {
    API,
    Logging,
    Service,
    PlatformConfig,
    DynamicPlatformPlugin,
    PlatformAccessory,
    UnknownContext,
    Categories,
    WithUUID,
    CharacteristicValue
} from 'homebridge';

import { FanController } from './fan/fanController';
import { VesyncClient } from './api/client';
import { VesyncFan } from './fan/vesyncFan';

const client = new VesyncClient();

interface Config extends PlatformConfig {
    username: string;
    password: string;
}

class LevoitAirPurifier {
    private readonly airPurifierService: Service;
    private readonly airQualityService: Service;
    fanController:FanController;


    constructor(
        private readonly fan: VesyncFan,
        private readonly log: Logging,
        private readonly accessory: PlatformAccessory,
        private readonly api: API
    ) {
        this.fanController = new FanController(fan, client);
        this.log.info("Fan Details are :", this.fanController.returnCurrentdetails())
        this.airPurifierService = this.getOrAddService(this.api.hap.Service.AirPurifier);

        // create handlers for required characteristics
        this.airPurifierService.getCharacteristic(this.api.hap.Characteristic.Active)
        .onGet(this.handleActiveGet.bind(this))
        .onSet(this.handleActiveSet.bind(this));

        this.airPurifierService.getCharacteristic(this.api.hap.Characteristic.CurrentAirPurifierState)
        .onGet(this.handleCurrentAirPurifierStateGet.bind(this));

        this.airPurifierService.getCharacteristic(this.api.hap.Characteristic.TargetAirPurifierState)
        .onGet(this.handleTargetAirPurifierStateGet.bind(this))
        .onSet(this.handleTargetAirPurifierStateSet.bind(this));


        this.airPurifierService.getCharacteristic(this.api.hap.Characteristic.RotationSpeed)
        .setProps({ minStep: 25, maxValue: 100 })
        .onGet(this.handleRotationSpeedGet.bind(this))
        .onSet(this.handleRotationSpeedSet.bind(this));

        this.airQualityService = this.getOrAddService(this.api.hap.Service.AirQualitySensor);
        this.airQualityService.getCharacteristic(this.api.hap.Characteristic.AirQuality)
        .onGet(() => {
        const pm25Density=this.fanController.getAirQuality();
            if (pm25Density <= 7) {
                return this.api.hap.Characteristic.AirQuality.EXCELLENT;
                } else if (pm25Density > 7 && pm25Density <= 15) {
                return this.api.hap.Characteristic.AirQuality.GOOD;
                } else if (pm25Density > 15 && pm25Density <= 30) {
                return this.api.hap.Characteristic.AirQuality.FAIR;
                } else if (pm25Density > 30 && pm25Density <= 55) {
                return this.api.hap.Characteristic.AirQuality.INFERIOR;
                } else if (pm25Density > 55) {
                return this.api.hap.Characteristic.AirQuality.POOR;
            }
        });
    }

        /**
     * Handle requests to get the current value of the "Active" characteristic
     */
    handleActiveGet() {
        this.log.info('Triggered GET Active');

        const isOn = this.fanController.isOn();
        this.log.info('GET Active isOn Val is:',isOn);
        return isOn ? this.api.hap.Characteristic.Active.ACTIVE : this.api.hap.Characteristic.Active.INACTIVE;

    }

    /**
     * Handle requests to set the "Active" characteristic
     */
    async handleActiveSet(value) {
        this.log.info('Triggered SET Active:', value);
        const power : boolean = value === this.api.hap.Characteristic.Active.ACTIVE;
        this.log.info('Power Value is:', power);
        const rval= await this.fanController.setPower(power);
        this.log.info('Rval for SET ACTIVE is:', rval);

        return rval == true ? value : undefined;
    }

    /**
     * Handle requests to get the current value of the "Current Air Purifier State" characteristic
     */
    handleCurrentAirPurifierStateGet() {
        this.log.info('Triggered GET CurrentAirPurifierState');

        if(this.fanController.isOn()){
            return this.api.hap.Characteristic.CurrentAirPurifierState.PURIFYING_AIR;
        }
        else
        {
            return this.api.hap.Characteristic.CurrentAirPurifierState.INACTIVE;
        }

    }


    /**
     * Handle requests to get the current value of the "Target Air Purifier State" characteristic
     */
    handleTargetAirPurifierStateGet() {
        this.log.info('Triggered GET TargetAirPurifierState');
        this.log.info('Current Fan Mode is :',this.fanController.getFanMode());
        if(this.fanController.getFanMode()=="auto")
        {
            return this.api.hap.Characteristic.TargetAirPurifierState.AUTO;
        }
        else if(this.fanController.getFanMode()=="manual"){
            return this.api.hap.Characteristic.TargetAirPurifierState.MANUAL;

        }
    }

    /**
     * Handle requests to set the "Target Air Purifier State" characteristic
     */
    async handleTargetAirPurifierStateSet(value) {
        this.log.info('Triggered SET TargetAirPurifierState:', value);

        if(value===this.api.hap.Characteristic.TargetAirPurifierState.AUTO)
        {
            const rval = await this.fanController.setFanMode("auto") === true ? value : undefined;
            this.log.info('Rval TargetAirPurifierState:', rval);
            return rval;

        }
        else if(value===this.api.hap.Characteristic.TargetAirPurifierState.MANUAL){

            const rval = await this.fanController.setFanMode("manual") === true ? value : undefined;
            this.log.info('Rval TargetAirPurifierState:', rval);
            return rval;

        }
    }

    /**
     * Handle requests to get the current value of the "Rotation Speed" characteristic
     */
    handleRotationSpeedGet() {
        this.log.info('Triggered GET RotationSpeed');
        const RATIO = 25;
        // NOTE: `.toFixed` returns `string`
        const toPercentage = (speed: number) => Math.round((speed * RATIO) * 100) / 100;
        const rval=toPercentage(this.fanController.getFanSpeed());
        this.log.info('Rval for GET RotationSpeed',rval);

        return rval;
    }

    /**
     * Handle requests to set the current value of the "Rotation Speed" characteristic
     */
     async handleRotationSpeedSet(value) {
        this.log.info('Triggered SET RotationSpeed',value);

        if (value <= 25)
        {
            return await this.fanController.setFanSpeed(1) === true ? value : undefined;
        }
        else if (value <=50)
        {
            return await this.fanController.setFanSpeed(2) === true ? value : undefined;
        }
        else if (value <=75)
        {
            return await this.fanController.setFanSpeed(3) === true ? value : undefined;
        }
        else if (value > 75)
        {
            return await this.fanController.setFanSpeed(4) === true ? value : undefined;
        }
    }



    private getOrAddService<T extends WithUUID<typeof Service>>(service: T): Service {
        return this.accessory.getService(service) ?? this.accessory.addService(service);
    }
}

class VesyncPlatform implements DynamicPlatformPlugin {
    private readonly cachedAccessories: PlatformAccessory[] = [];

    constructor(
        private readonly log: Logging,
        config: Config,
        private readonly api: API
    ) {
        this.api.on('didFinishLaunching', async () => {
            await client.login(config.username, config.password);
            await this.findDevices();
          });
    }

    private async findDevices() {
        const fans = await client.getDevices();
        fans.forEach(fan => {
            const cached = this.cachedAccessories.find(a => a.UUID === fan.uuid);
            if (cached) {
                this.log.info('Restoring cached accessory: ' + cached.displayName);
                new LevoitAirPurifier(fan, this.log, cached, this.api);
            } else {
                this.log.info('Creating new fan accessory...')
                const platformAccessory = new this.api.platformAccessory(fan.name, fan.uuid, Categories.AIR_PURIFIER);
                new LevoitAirPurifier(fan, this.log, platformAccessory, this.api);
                this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [platformAccessory]);
            }
        });
    }

    /**
   * REQUIRED - Homebridge will call the "configureAccessory" method once for every cached
   * accessory restored
   */
    configureAccessory(accessory: PlatformAccessory<UnknownContext>): void {
        this.cachedAccessories.push(accessory);
    }

}

const PLUGIN_NAME = 'homebridge-levoitcore-client';
const PLATFORM_NAME = 'VesyncPlatform';

export = (homebridge: API) => {
    homebridge.registerPlatform(PLATFORM_NAME, VesyncPlatform);
};
