// fix some stuff for dev
import './debug';
// fix global variables/methods
import './global';

// import app
import Application from './src/app';

// create instance and run the xumm
const XUMM = new Application();
XUMM.run();
