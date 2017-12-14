import React from 'react';
import ReactDOM from 'react-dom';

import Loader from './components/Loader';

window.onload = _ => {
    ReactDOM.render(
    <Loader />,
    document.getElementById('main'));
  }