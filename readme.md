# Noise Logger

## Introduction

I have had to stop working on this project as my company no longer uses BSWA sound level meters.  I will leave it here in case it helps someone.  I got to the point of being able to log noise levels from the meter to a CSV file, and update the settings on the device, plus other stuff.  I was working on creating an electron front end for the program, but didn't get far.  Have fun!

This project aims to create an application for the control of the BSWA 308 and 309 sound level meters which allow control via RS232.  The BSWA manual has a list of possible commands.

## Setup

Install nodejs from nodejs.org

Go to this directory and run the command

```sh
npm install
```

## Development
All functions are stored in library.js and strung together with the following:

To get the current settings of the 14 custom measures in the BSWA
```sh
node getCustomMeasures.js
```

To set the 14 custom measures in the BSWA, settings are entered into the customMeasureInput variable in library.js:
```sh
node setCustomMeasures.js
```

To start logging noise levels of the Custom Measures to data.csv the command:
```sh
node logCM.js
```

To check if the SLM is running or not:
```sh
node checkState.js
```

To get the Statistical Measure settings:
```sh
node getStats.js
```

To set the Statistical Measure settings, settings are entered into the statSettings variable in library.js:
```sh
node setStats.js
```

## Notes

* Make sure deviceID is set to 1 on the logger
* Commands are sent and received as STX, ID, ATTR, Command or Data, ETX, BCC, CR, LF (eg 0x02, 0x01, 0x43, 0x44, 0x43, 0x55, 0x33, 0x20, 0x3F, 0x03, 0x3D, 0x0D, 0x0A)
* The BCC Block Check Character is calculated by XOR operation of the ATTR and the Command e.g. 43,44,43,55,33,20,3F = 3D. Calculator: https://toolslick.com/math/bitwise/xor-calculator
