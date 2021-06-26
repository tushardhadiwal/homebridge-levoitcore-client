# homebridge-levoitcore-client

![GitHub Workflow Status](https://img.shields.io/github/workflow/status/tushardhadiwal/homebridge-levoitcore-client/Build)

A [Homebridge](https://github.com/homebridge/homebridge) plugin to control Levoit Air Purifiers with via the Vesync Platform.

**NOTE: This plugin is developed to support my Levoit Core400S/200S Air Purifier. It may work for you as well.**

Inspired from https://github.com/Kwintenvdb/homebridge-vesync-client which unfortunately does not support latest Levoit purifiers, so I had to make one for myself.

## Installation

See the [Homebridge](https://github.com/homebridge/homebridge) documentation for how to install and run Homebridge.

To install the plugin, run the following on the command line on the machine where Homebridge is installed:

```
npm install -g homebridge-levoitcore-client
```

## Configuration

- Via the Homebridge UI, enter the **Homebridge Vesync Client** plugin settings.
- Enter your [Vesync app](https://www.vesync.com/app) credentials.
- Save and restart Homebridge.

This plugin requires your Vesync credentials as it communicates with the Vesync devices via Vesync's own API. Your credentials are only stored in the Homebridge config and not sent to any server except Vesync's.

You can also do this directly via the homebridge config by adding your credentials to the config file under `platforms`. Replace the values of `username` and `password` by your credentials.

```json
"platforms": [
    {
        "platform": "VesyncPlatform",
        "username": "email@example.com",
        "password": "enter_your_password"
    }
]
```

## Features

This plugin currently supports the following features.

### Levoit Air Purifier

- Turning the Air Purifier on and off
- Changing fan speed
- Toggling Manual and auto mode
- Getting Current Air Quality


## Local Development

If you want to develop and run the plugin locally, you can do the following:

1. Clone the repository.
1. Run the following scripts on the command line:

```
cd homebridge-levoitcore-client
npm install
npm run watch
npm link
```

Afterwards, restart Homebridge. Restart Homebridge whenever you have made changes to the code.
