import React from 'react';

import { ContextProps } from './types';

export const MethodsContext = React.createContext<Partial<ContextProps>>({});
