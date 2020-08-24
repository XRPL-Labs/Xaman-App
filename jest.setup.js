/* istanbul ignore file */

import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

Enzyme.configure({ adapter: new Adapter() });

// hide console.log in jest tests
jest.spyOn(global.console, 'log').mockImplementation(() => jest.fn());

// mock native event emitter
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');
