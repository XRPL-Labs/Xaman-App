import React from 'react';

import { ContextProps } from './types';

export const StepsContext = React.createContext<Partial<ContextProps>>({});
