# Noise Logger

## Setup

Install nodejs from nodejs.org

Go to this directory and run the command

```sh
npm install
```

## Development

Run the command

```sh
node index.js
```

## Notes

* Ignore all the files in the node_modules directory. They are installed from npm (node package manager).
* Make sure deviceID is set to 1
* Commands are sent and received as STX, ID, ATTR, Command or Data, ETX, BCC, CR, LF (eg 0x02, 0x01, 0x43, 0x44, 0x43, 0x55, 0x33, 0x20, 0x3F, 0x03, 0x3D, 0x0D, 0x0A)
* The BCC Block Check Character is calculated by XOR operation of the ATTR and the Command e.g. 43,44,43,55,33,20,3F = 3D. Calculator: https://toolslick.com/math/bitwise/xor-calculator
