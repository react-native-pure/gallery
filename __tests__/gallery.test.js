'use strict';

import React from 'react'
import {render} from 'react-native-testing-library'
import App from '../Example/App'

describe('TreeModal', () => {
    it('renders correctly', () => {
        const instance = render(
            <App/>
        );
        expect(instance.toJSON()).toMatchSnapshot();
    });
});
