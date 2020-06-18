// import './.storybook';

// fix some stuff for dev
import './debug';
// fix global variables/methods
import './global';

// import app
import Application from './src/app';

// run the app
Application.run();
