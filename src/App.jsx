import React, { useState } from 'react'
import './App.css'
import InstallButton from './components/ui/InstallButton';

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js').then(function (registration) {
            console.log('ServiceWorker registration successful');
        }, function (err) {
            // console.log('ServiceWorker registration failed: ', err);
        });
    });
}

function App() {
    return (
        <>
            {/* <h1 class="text-3xl font-bold underline">
                Hello world!
            </h1> */}
            <InstallButton />
        </>
    )
}

export default App
