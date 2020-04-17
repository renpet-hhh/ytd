import React from 'react';

export type ExtractRef<C extends React.ElementType> = React.ComponentPropsWithRef<C>['ref'];
