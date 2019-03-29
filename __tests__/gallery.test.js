'use strict';

import React from 'react'
import {render} from 'react-native-testing-library'
import GalleryView from '../index'

describe('GallerView', () => {
    it('renders correctly', () => {
        const instance = render(
            <GalleryView/>
        );
        expect(instance.toJSON()).toMatchSnapshot();
    });
});
