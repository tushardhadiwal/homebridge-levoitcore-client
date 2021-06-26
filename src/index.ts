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

    constructor(
        private readonly fan: VesyncFan,
        private readonly log: Logging,
        private readonly accessory: PlatformAccessory,
        private readonly api: API
    ) {
        const fanController = new FanController(fan, client);
        const hap = api.hap;
        this.airPurifierService = this.getOrAddService(hap.Service.AirPurifier);

        this.airPurifierService.getCharacteristic(hap.Characteristic.Active)
            .onGet(() => {
                const isOn = fanController.isOn();
                return isOn ? hap.Characteristic.Active.ACTIVE : hap.Characteristic.Active.INACTIVE;
            })
            .onSet((value: CharacteristicValue) => {
                const power = value === hap.Characteristic.Active.ACTIVE;
                fanController.setPower(power);
                return value;
            });

        this.airPurifierService.getCharacteristic(hap.Characteristic.CurrentAirPurifierState)
            .onGet(() => {
                if(fanController.isOn()){
                    return hap.Characteristic.CurrentAirPurifierState.PURIFYING_AIR;
                }
                else
                {
                    return hap.Characteristic.CurrentAirPurifierState.INACTIVE;
                }
            });
        
        this.airPurifierService.getCharacteristic(hap.Characteristic.TargetAirPurifierState)
            .onGet(() => {
                if(fanController.getFanMode()=="auto")
                {
                    return hap.Characteristic.TargetAirPurifierState.AUTO;

                }
                else if(fanController.getFanMode()=="manual"){
                    return hap.Characteristic.TargetAirPurifierState.MANUAL;

                }
            })
            .onSet((state: CharacteristicValue) => {

                if(state===hap.Characteristic.TargetAirPurifierState.AUTO)
                {
                    return fanController.setFanMode("auto");

                }
                else if(state===hap.Characteristic.TargetAirPurifierState.MANUAL){

                    return fanController.setFanMode("manual");;
                }
            });;

        this.airPurifierService.getCharacteristic(hap.Characteristic.RotationSpeed)
            .setProps({ minStep: 25, maxValue: 100 })
            .onGet(() => {
                const level = fanController.getFanSpeed();
                return level * 25;
            })
            .onSet((value: CharacteristicValue) => {

                if (value <= 25)
                {
                    fanController.setFanSpeed(1);
                }
                else if (value <=50)
                {
                    fanController.setFanSpeed(2);
                }
                else if (value <=75)
                {
                    fanController.setFanSpeed(3);
                }
                else if (value <=100)
                {
                    fanController.setFanSpeed(4);
                }
                return value;
            });

        this.airQualityService = this.getOrAddService(hap.Service.AirQualitySensor);
        this.airQualityService.getCharacteristic(hap.Characteristic.AirQuality)
            .onGet(() => {
                const pm25Density=fanController.getAirQuality();
                if (pm25Density <= 7) {
                    return hap.Characteristic.AirQuality.EXCELLENT;
                    } else if (pm25Density > 7 && pm25Density <= 15) {
                    return hap.Characteristic.AirQuality.GOOD;
                    } else if (pm25Density > 15 && pm25Density <= 30) {
                    return hap.Characteristic.AirQuality.FAIR;
                    } else if (pm25Density > 30 && pm25Density <= 55) {
                    return hap.Characteristic.AirQuality.INFERIOR;
                    } else if (pm25Density > 55) {
                    return hap.Characteristic.AirQuality.POOR;
                    }
            });
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
                this.log.debug('Restoring cached accessory: ' + cached.displayName);
                new LevoitAirPurifier(fan, this.log, cached, this.api);
            } else {
                this.log.debug('Creating new fan accessory...')
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
