# Noise Logger

## Introduction

This project aims to create an application for the control of the BSWA 308 and 309 sound level meters which allow control via RS232.  The BSWA manual has a list of possible commands.

## Setup

Install nodejs from nodejs.org

Go to this directory and run the command

```sh
npm install
```

## Development
To start the noise logger

```sh
node start_meas.js
```

To start logging noise levels of the Custom Measures to data.csv the command

```sh
node log_cm.js
```
To stop the noise logger

```sh
node stop_meas.js
```


## Notes

* Make sure deviceID is set to 1 on the logger
* Commands are sent and received as STX, ID, ATTR, Command or Data, ETX, BCC, CR, LF (eg 0x02, 0x01, 0x43, 0x44, 0x43, 0x55, 0x33, 0x20, 0x3F, 0x03, 0x3D, 0x0D, 0x0A)
* The BCC Block Check Character is calculated by XOR operation of the ATTR and the Command e.g. 43,44,43,55,33,20,3F = 3D. Calculator: https://toolslick.com/math/bitwise/xor-calculator
