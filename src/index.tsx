import React from 'react';
import ReactDOM from 'react-dom';

import Loader from './components/Loader';

//import './index.scss';

window.onload = _ => {
    ReactDOM.render(
    <Loader />,
    document.getElementById('main'));
  }